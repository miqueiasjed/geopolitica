<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AlphaVantageService
{
    private const BASE_URL = 'https://www.alphavantage.co/query';

    private const TTL_COTACAO_MIN  = 5;
    private const TTL_HISTORICO_H  = 6;
    private const TTL_FUNDAMENTOS_H = 24;

    // Símbolos internos → função Alpha Vantage
    private const MAPA_COMMODITIES = [
        'BZ=F' => 'BRENT',
        'NG=F' => 'NATURAL_GAS',
        'ZS=F' => 'SOYBEANS',
        'ZW=F' => 'WHEAT',
    ];

    private string $apiKey;

    public function __construct(?string $apiKey = null)
    {
        $this->apiKey = (string) ($apiKey ?? config('services.alphavantage.api_key', ''));
    }

    /**
     * Retorna cotações para os símbolos informados com cache de 5 minutos.
     *
     * @param  array<string>  $simbolos
     * @return array<string, array{valor: float, variacao_pct: float, variacao_abs: float}>
     */
    public function buscarCotacoes(array $simbolos): array
    {
        $resultados = [];

        foreach ($simbolos as $simbolo) {
            if (! isset(self::MAPA_COMMODITIES[$simbolo])) {
                continue;
            }

            $cotacao = $this->cotacaoComCache($simbolo);

            if ($cotacao !== null) {
                $resultados[$simbolo] = $cotacao;
            }
        }

        return $resultados;
    }

    /**
     * Retorna cotação do câmbio (ex: USD → BRL) com cache de 5 minutos.
     * Falhas não são cacheadas.
     *
     * @return array{valor: float, variacao_pct: float, variacao_abs: float}|null
     */
    public function buscarCambio(string $de, string $para): ?array
    {
        $chave = "alpha:cotacao:forex:{$de}{$para}";

        if (Cache::has($chave)) {
            return Cache::get($chave);
        }

        $resultado = $this->fetchForex($de, $para);

        if ($resultado !== null) {
            Cache::put($chave, $resultado, now()->addMinutes(self::TTL_COTACAO_MIN));
        }

        return $resultado;
    }

    /**
     * Retorna a série histórica diária de um símbolo com cache de 6 horas.
     *
     * @return array<int, array{date: string, value: string}>
     */
    public function buscarHistorico(string $simbolo): array
    {
        if (! isset(self::MAPA_COMMODITIES[$simbolo])) {
            return [];
        }

        $funcao = self::MAPA_COMMODITIES[$simbolo];
        $chave  = "alpha:historico:{$simbolo}";

        if (Cache::has($chave)) {
            return Cache::get($chave);
        }

        $serie = $this->fetchSerie($funcao);

        if (! empty($serie)) {
            Cache::put($chave, $serie, now()->addHours(self::TTL_HISTORICO_H));
        }

        return $serie;
    }

    /**
     * Retorna fundamentos de uma ação/ETF com cache de 1 dia.
     *
     * @return array<string, mixed>
     */
    public function buscarFundamentos(string $simbolo): array
    {
        $chave = "alpha:fundamentos:{$simbolo}";

        return Cache::remember($chave, now()->addDay(), function () use ($simbolo) {
            return $this->fetchOverview($simbolo);
        });
    }

    // ─── Métodos privados ─────────────────────────────────────────────────────

    /**
     * Busca a cotação mais recente de uma commodity, usando cache de 5 min.
     * Calcula variação com base nos dois últimos pontos da série diária.
     * Falhas não são cacheadas — a próxima chamada tentará novamente.
     */
    private function cotacaoComCache(string $simbolo): ?array
    {
        $chave = "alpha:cotacao:{$simbolo}";

        if (Cache::has($chave)) {
            return Cache::get($chave);
        }

        $funcao = self::MAPA_COMMODITIES[$simbolo];
        $serie  = $this->fetchSerie($funcao);

        if (count($serie) < 2) {
            return null;
        }

        $atual    = (float) ($serie[0]['value'] ?? 0);
        $anterior = (float) ($serie[1]['value'] ?? 0);

        if ($atual == 0.0 || $anterior == 0.0) {
            return null;
        }

        $resultado = [
            'valor'        => $atual,
            'variacao_pct' => round((($atual - $anterior) / $anterior) * 100, 4),
            'variacao_abs' => round($atual - $anterior, 4),
        ];

        Cache::put($chave, $resultado, now()->addMinutes(self::TTL_COTACAO_MIN));

        return $resultado;
    }

    /**
     * Chama o endpoint de série diária de uma commodity.
     * Retorna array em ordem descendente (mais recente primeiro).
     *
     * @return array<int, array{date: string, value: string}>
     */
    private function fetchSerie(string $funcao): array
    {
        try {
            $resposta = Http::timeout(15)->get(self::BASE_URL, [
                'function' => $funcao,
                'interval' => 'daily',
                'apikey'   => $this->apiKey,
            ]);

            if ($resposta->failed()) {
                Log::warning("AlphaVantageService: falha ao buscar {$funcao}.", [
                    'status' => $resposta->status(),
                ]);

                return [];
            }

            $dados = $resposta->json();

            if (empty($dados['data'])) {
                Log::warning("AlphaVantageService: resposta sem 'data' para {$funcao}.", [
                    'chaves' => array_keys($dados ?? []),
                ]);

                return [];
            }

            return $dados['data'];
        } catch (\Throwable $e) {
            Log::warning("AlphaVantageService: exceção ao buscar {$funcao}.", [
                'erro' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Busca a taxa de câmbio em tempo real e calcula variação via FX_DAILY.
     *
     * @return array{valor: float, variacao_pct: float, variacao_abs: float}|null
     */
    private function fetchForex(string $de, string $para): ?array
    {
        try {
            $resposta = Http::timeout(15)->get(self::BASE_URL, [
                'function'      => 'CURRENCY_EXCHANGE_RATE',
                'from_currency' => $de,
                'to_currency'   => $para,
                'apikey'        => $this->apiKey,
            ]);

            if ($resposta->failed()) {
                Log::warning("AlphaVantageService: falha ao buscar câmbio {$de}/{$para}.", [
                    'status' => $resposta->status(),
                ]);

                return null;
            }

            $dados = $resposta->json();
            $taxa  = $dados['Realtime Currency Exchange Rate'] ?? null;

            if (empty($taxa)) {
                Log::warning("AlphaVantageService: resposta inesperada para câmbio {$de}/{$para}.", [
                    'chaves' => array_keys($dados ?? []),
                ]);

                return null;
            }

            $valor = (float) ($taxa['5. Exchange Rate'] ?? 0);

            if ($valor == 0.0) {
                return null;
            }

            $variacaoPct = 0.0;
            $variacaoAbs = 0.0;

            $serieDiaria = $this->fetchSerieForex($de, $para);

            if (count($serieDiaria) >= 1) {
                $anterior    = (float) ($serieDiaria[0]['close'] ?? 0);
                if ($anterior > 0.0) {
                    $variacaoPct = round((($valor - $anterior) / $anterior) * 100, 4);
                    $variacaoAbs = round($valor - $anterior, 4);
                }
            }

            return [
                'valor'        => $valor,
                'variacao_pct' => $variacaoPct,
                'variacao_abs' => $variacaoAbs,
            ];
        } catch (\Throwable $e) {
            Log::warning("AlphaVantageService: exceção ao buscar câmbio {$de}/{$para}.", [
                'erro' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Busca série histórica diária de câmbio (FX_DAILY), cache 6 h.
     * Retorna array em ordem descendente pelo campo 'date'.
     *
     * @return array<int, array{date: string, close: string}>
     */
    private function fetchSerieForex(string $de, string $para): array
    {
        $chave = "alpha:historico:forex:{$de}{$para}";

        if (Cache::has($chave)) {
            return Cache::get($chave);
        }

        try {
            $resposta = Http::timeout(15)->get(self::BASE_URL, [
                'function'    => 'FX_DAILY',
                'from_symbol' => $de,
                'to_symbol'   => $para,
                'outputsize'  => 'compact',
                'apikey'      => $this->apiKey,
            ]);

            if ($resposta->failed()) {
                return [];
            }

            $dados = $resposta->json();
            $serie = $dados['Time Series FX (Daily)'] ?? [];

            if (empty($serie)) {
                return [];
            }

            $resultado = [];
            foreach ($serie as $data => $valores) {
                $resultado[] = [
                    'date'  => $data,
                    'close' => $valores['4. close'] ?? '0',
                ];
            }

            usort($resultado, fn ($a, $b) => strcmp($b['date'], $a['date']));

            Cache::put($chave, $resultado, now()->addHours(self::TTL_HISTORICO_H));

            return $resultado;
        } catch (\Throwable $e) {
            Log::warning("AlphaVantageService: exceção ao buscar FX_DAILY {$de}/{$para}.", [
                'erro' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Busca dados fundamentalistas de uma ação/ETF via endpoint OVERVIEW.
     *
     * @return array<string, mixed>
     */
    private function fetchOverview(string $simbolo): array
    {
        try {
            $resposta = Http::timeout(15)->get(self::BASE_URL, [
                'function' => 'OVERVIEW',
                'symbol'   => $simbolo,
                'apikey'   => $this->apiKey,
            ]);

            if ($resposta->failed()) {
                Log::warning("AlphaVantageService: falha ao buscar fundamentos {$simbolo}.", [
                    'status' => $resposta->status(),
                ]);

                return [];
            }

            return $resposta->json() ?? [];
        } catch (\Throwable $e) {
            Log::warning("AlphaVantageService: exceção ao buscar fundamentos {$simbolo}.", [
                'erro' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
