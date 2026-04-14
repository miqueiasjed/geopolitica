<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MarketFetcherService
{
    private const URL_YAHOO = 'https://query1.finance.yahoo.com/v8/finance/spark';
    private const URL_CAMBIO = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

    /**
     * Busca cotações no Yahoo Finance para os símbolos informados.
     *
     * @param  array<string>  $simbolos
     * @return array<string, array{valor: float, variacao_pct: float, variacao_abs: float}>
     */
    public function buscarYahooFinance(array $simbolos): array
    {
        $parametros = implode(',', $simbolos);

        try {
            $resposta = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ])->get(self::URL_YAHOO, [
                'symbols'  => $parametros,
                'range'    => '1d',
                'interval' => '15m',
            ]);

            if ($resposta->failed()) {
                Log::warning('MarketFetcherService: falha na requisição ao Yahoo Finance.', [
                    'status' => $resposta->status(),
                ]);

                return [];
            }

            $dados = $resposta->json();

            return $this->parsearRespostaYahoo($dados);
        } catch (\Throwable $e) {
            Log::warning('MarketFetcherService: exceção ao buscar Yahoo Finance.', [
                'erro' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Busca cotação do câmbio USD/BRL via awesomeapi.
     *
     * @return array<string, array{valor: float, variacao_pct: float, variacao_abs: float}>
     */
    public function buscarCambioBCB(): array
    {
        try {
            $resposta = Http::get(self::URL_CAMBIO);

            if ($resposta->failed()) {
                Log::warning('MarketFetcherService: falha na requisição à awesomeapi (câmbio BCB).', [
                    'status' => $resposta->status(),
                ]);

                return [];
            }

            $dados = $resposta->json();

            if (empty($dados['USDBRL'])) {
                Log::warning('MarketFetcherService: resposta inesperada da awesomeapi.', [
                    'resposta' => $dados,
                ]);

                return [];
            }

            $registro    = $dados['USDBRL'];
            $bid         = (float) $registro['bid'];
            $abertura    = (float) $registro['open'];
            $variacaoPct = (float) $registro['pctChange'];
            $variacaoAbs = $bid - $abertura;

            return [
                'USDBRL=X' => [
                    'valor'        => $bid,
                    'variacao_pct' => $variacaoPct,
                    'variacao_abs' => $variacaoAbs,
                ],
            ];
        } catch (\Throwable $e) {
            Log::warning('MarketFetcherService: exceção ao buscar câmbio BCB.', [
                'erro' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Parseia a resposta da API Spark do Yahoo Finance.
     *
     * @param  array<mixed>  $dados
     * @return array<string, array{valor: float, variacao_pct: float, variacao_abs: float}>
     */
    private function parsearRespostaYahoo(array $dados): array
    {
        $resultados = $dados['spark']['result'] ?? [];

        if (empty($resultados)) {
            Log::warning('MarketFetcherService: nenhum resultado retornado pelo Yahoo Finance.');

            return [];
        }

        $cotacoes = [];

        foreach ($resultados as $item) {
            $simbolo = $item['symbol'] ?? null;
            $meta    = $item['response'][0]['meta'] ?? null;

            if (! $simbolo || ! $meta) {
                continue;
            }

            $precoAtual    = (float) ($meta['regularMarketPrice'] ?? 0);
            $precoAnterior = (float) ($meta['chartPreviousClose'] ?? 0);

            if ($precoAnterior == 0) {
                continue;
            }

            $variacaoPct = (($precoAtual - $precoAnterior) / $precoAnterior) * 100;
            $variacaoAbs = $precoAtual - $precoAnterior;

            $cotacoes[$simbolo] = [
                'valor'        => $precoAtual,
                'variacao_pct' => round($variacaoPct, 4),
                'variacao_abs' => round($variacaoAbs, 4),
            ];
        }

        return $cotacoes;
    }
}
