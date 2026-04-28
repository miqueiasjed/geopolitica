<?php

namespace App\Services;

use App\Models\AlertaPreditivo;
use App\Models\Carteira;
use App\Models\MapaRiscoAtivo;
use App\Services\Ai\AiProviderFactory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RiskScoreService
{
    private const MAPA_CATEGORIAS = [
        'energy'     => 'energy', 'oil' => 'energy', 'gas' => 'energy',
        'food'       => 'food',   'agriculture' => 'food', 'grain' => 'food',
        'currency'   => 'fx',     'trade' => 'fx', 'sanctions' => 'fx',
        'military'   => 'military', 'war' => 'military', 'conflict' => 'military',
    ];

    private const NOMES_PT_BR = [
        'energy'   => 'Energia',
        'food'     => 'Alimentos',
        'fx'       => 'Câmbio',
        'military' => 'Militar',
    ];

    private const SCORES_PADRAO = [
        'energy'   => 30,
        'food'     => 25,
        'fx'       => 35,
        'military' => 40,
    ];

    public function calcularTensaoPorCategoria(): array
    {
        $eventos = DB::table('eventos')
            ->where('is_active', true)
            ->where('published_at', '>=', now()->subHours(48))
            ->select('impact_score', 'categories')
            ->get();

        if ($eventos->isEmpty()) {
            return self::SCORES_PADRAO;
        }

        $acumuladores = [
            'energy'   => ['soma' => 0, 'count' => 0],
            'food'     => ['soma' => 0, 'count' => 0],
            'fx'       => ['soma' => 0, 'count' => 0],
            'military' => ['soma' => 0, 'count' => 0],
        ];

        foreach ($eventos as $evento) {
            $categorias = json_decode($evento->categories ?? '[]', true);

            if (! is_array($categorias)) {
                continue;
            }

            foreach ($categorias as $categoria) {
                $categoriaLower = strtolower((string) $categoria);

                if (! isset(self::MAPA_CATEGORIAS[$categoriaLower])) {
                    continue;
                }

                $chave = self::MAPA_CATEGORIAS[$categoriaLower];
                $acumuladores[$chave]['soma']  += (float) ($evento->impact_score ?? 0);
                $acumuladores[$chave]['count'] += 1;
            }
        }

        $tensao = [];

        foreach ($acumuladores as $chave => $dados) {
            if ($dados['count'] === 0) {
                $tensao[$chave] = self::SCORES_PADRAO[$chave];
            } else {
                $tensao[$chave] = min(100, round(($dados['soma'] / $dados['count']) * 10));
            }
        }

        return $tensao;
    }

    public function calcularRiscoPortfolio(array $ativos): array
    {
        $tensao  = $this->calcularTensaoPorCategoria();
        $tickers = array_column($ativos, 'ticker');

        $mapeamentos = MapaRiscoAtivo::whereIn('ticker', $tickers)
            ->get()
            ->keyBy('ticker');

        $naoMapeados = array_values(
            array_filter($tickers, fn ($ticker) => ! $mapeamentos->has($ticker))
        );

        if (! empty($naoMapeados)) {
            $mapeadosViaIa = $this->mapearAtivoComIA($naoMapeados);
            $mapeamentos   = $mapeamentos->merge($mapeadosViaIa);
        }

        $scores    = ['energy' => 0.0, 'food' => 0.0, 'fx' => 0.0, 'military' => 0.0];
        $somaPesos = array_sum(array_column($ativos, 'peso'));

        foreach ($ativos as $ativo) {
            $ticker = $ativo['ticker'];
            $peso   = (float) $ativo['peso'];

            /** @var MapaRiscoAtivo|null $mapa */
            $mapa         = $mapeamentos->get($ticker);
            $riskWeights  = $mapa?->risk_weights ?? [];

            foreach (array_keys($scores) as $categoria) {
                $scores[$categoria] += $tensao[$categoria] * ($riskWeights[$categoria] ?? 0) * $peso;
            }
        }

        if ($somaPesos > 0) {
            foreach (array_keys($scores) as $categoria) {
                $scores[$categoria] = min(100, round($scores[$categoria] / $somaPesos));
            }
        }

        $total = round(($scores['energy'] + $scores['food'] + $scores['fx'] + $scores['military']) / 4);

        $alertas = AlertaPreditivo::orderByDesc('created_at')->limit(3)->get();

        $topRiscos = collect($scores)
            ->sortDesc()
            ->take(2)
            ->keys()
            ->map(fn ($cat) => self::NOMES_PT_BR[$cat] ?? $cat)
            ->values()
            ->toArray();

        return [
            'total'       => $total,
            'breakdown'   => [
                'energia'   => round($scores['energy']),
                'alimentos' => round($scores['food']),
                'cambio'    => round($scores['fx']),
                'militar'   => round($scores['military']),
            ],
            'alertas'      => $alertas->map(fn ($a) => [
                'title' => $a->titulo,
                'level' => $a->nivel ?? 'medium',
            ])->toArray(),
            'top_riscos'   => $topRiscos,
            'calculado_em' => now()->toISOString(),
        ];
    }

    public function mapearAtivoComIA(array $tickers): Collection
    {
        if (empty($tickers)) {
            return collect([]);
        }

        $listaTickers = implode(', ', $tickers);

        $prompt = <<<PROMPT
Para cada ativo abaixo, forneça os pesos de risco geopolítico (0.0 a 1.0).
Categorias: energy (petróleo, gás), food (agro, grãos), fx (câmbio, comércio, sanções), military (defesa, conflitos)
Ativos: {$listaTickers}
Retorne APENAS JSON válido (sem markdown): [{"ticker":"X","name":"Nome","asset_type":"stock_br","risk_weights":{"energy":0.0,"food":0.0,"fx":0.0,"military":0.0}}]
PROMPT;

        try {
            $resposta = AiProviderFactory::make()->complete(
                system:    'Você é um analista de risco geopolítico. Responda apenas com JSON válido, sem markdown.',
                messages:  [['role' => 'user', 'content' => $prompt]],
                maxTokens: 1024,
            );

            $dados = json_decode($resposta, true);

            if (! is_array($dados)) {
                return collect([]);
            }

            $linhasUpsert = array_map(fn ($item) => [
                'ticker'       => $item['ticker']       ?? '',
                'name'         => $item['name']         ?? $item['ticker'] ?? '',
                'asset_type'   => $item['asset_type']   ?? 'unknown',
                'risk_weights' => json_encode($item['risk_weights'] ?? ['energy' => 0, 'food' => 0, 'fx' => 0, 'military' => 0]),
                'updated_at'   => now(),
            ], $dados);

            $linhasUpsert = array_filter($linhasUpsert, fn ($l) => $l['ticker'] !== '');

            if (! empty($linhasUpsert)) {
                MapaRiscoAtivo::upsert(
                    array_values($linhasUpsert),
                    ['ticker'],
                    ['name', 'asset_type', 'risk_weights', 'updated_at'],
                );
            }

            $tickersSalvos = array_column($linhasUpsert, 'ticker');

            return MapaRiscoAtivo::whereIn('ticker', $tickersSalvos)
                ->get()
                ->keyBy('ticker');
        } catch (\Exception) {
            return collect([]);
        }
    }

    public function salvarCarteira(int $userId, array $ativos): Carteira
    {
        $somaPesos = array_sum(array_column($ativos, 'peso'));

        if ($somaPesos < 0.95 || $somaPesos > 1.05) {
            throw new \InvalidArgumentException(
                "A soma dos pesos deve ser aproximadamente 1.0 (entre 0.95 e 1.05). Soma atual: {$somaPesos}."
            );
        }

        $score = $this->calcularRiscoPortfolio($ativos);

        $carteira = Carteira::updateOrCreate(
            ['user_id' => $userId],
            [
                'ativos'       => $ativos,
                'ultimo_score' => $score,
            ],
        );

        $carteira->score = $score;

        return $carteira;
    }
}
