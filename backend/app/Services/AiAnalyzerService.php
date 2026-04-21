<?php

namespace App\Services;

use App\Services\Ai\AiProviderFactory;
use Illuminate\Support\Facades\Log;

class AiAnalyzerService
{
    private const TAMANHO_MAXIMO_LOTE = 5;

    public function analisar(array $itens): array
    {
        $itens = array_values(array_slice($itens, 0, self::TAMANHO_MAXIMO_LOTE));

        if ($itens === []) {
            return [];
        }

        try {
            if (! AiProviderFactory::hasApiKey()) {
                return array_map(fn (array $item) => $this->analisarLocalmente($item), $itens);
            }

            $conteudo = $this->solicitarAnalise($itens);
            $analises = $this->parsearResposta($conteudo, count($itens));

            return array_map(
                fn (array $item, array $analise) => $this->enriquecerItem($item, $analise),
                $itens,
                $analises,
            );
        } catch (\Throwable $throwable) {
            Log::warning('Falha ao analisar feed com Claude. Aplicando fallback local.', [
                'erro' => $throwable->getMessage(),
            ]);

            return array_map(fn (array $item) => $this->analisarLocalmente($item), $itens);
        }
    }

    protected function solicitarAnalise(array $itens): string
    {
        return AiProviderFactory::make()->complete(
            system:      $this->systemPrompt(),
            messages:    [['role' => 'user', 'content' => $this->userPrompt($itens)]],
            maxTokens:   (int) config('claude.max_tokens', 1024),
            temperature: 0.0,
        );
    }

    private function parsearResposta(string $conteudo, int $quantidadeEsperada): array
    {
        $json = json_decode($conteudo, true);

        if (! is_array($json)) {
            return array_fill(0, $quantidadeEsperada, $this->analiseNaoRelevante());
        }

        return collect($json)
            ->take($quantidadeEsperada)
            ->map(fn ($analise) => is_array($analise) ? $analise : $this->analiseNaoRelevante())
            ->pad($quantidadeEsperada, $this->analiseNaoRelevante())
            ->values()
            ->all();
    }

    private function enriquecerItem(array $item, array $analise): array
    {
        $impactScore = (int) ($analise['impact_score'] ?? 1);
        $impactScore = min(max($impactScore, 1), 10);
        $relevante = (bool) ($analise['relevante'] ?? false);

        return [
            ...$item,
            'relevante' => $relevante,
            'impact_score' => $relevante ? $impactScore : 1,
            'impact_label' => $relevante
                ? $this->mapearImpactLabel($impactScore)
                : 'MONITORAR',
            'analise_ia' => $relevante
                ? (string) ($analise['analise_ia'] ?? '')
                : (string) ($analise['analise_ia'] ?? 'Item sem relevância geopolítica material para investidores brasileiros.'),
            'regiao' => $analise['regiao'] ?? null,
            'categorias' => array_values(array_filter((array) ($analise['categorias'] ?? []))),
        ];
    }

    private function analisarLocalmente(array $item): array
    {
        $texto = mb_strtolower(trim(($item['titulo'] ?? '').' '.($item['resumo'] ?? '')));

        $categorias = [];
        $score = 1;
        $relevante = false;

        if ($this->contemTermo($texto, ['petroleo', 'petróleo', 'gas', 'gás', 'energia', 'oil', 'diesel'])) {
            $categorias[] = 'energia';
            $score = max($score, 7);
            $relevante = true;
        }

        if ($this->contemTermo($texto, ['dolar', 'dólar', 'real', 'cambio', 'câmbio', 'fx'])) {
            $categorias[] = 'cambio';
            $score = max($score, 6);
            $relevante = true;
        }

        if ($this->contemTermo($texto, ['soja', 'milho', 'trigo', 'alimentos', 'commodities', 'commodity'])) {
            $categorias[] = 'alimentos';
            $categorias[] = 'commodities';
            $score = max($score, 6);
            $relevante = true;
        }

        if ($this->contemTermo($texto, ['sancao', 'sanção', 'sanctions', 'embargo'])) {
            $categorias[] = 'sancoes';
            $score = max($score, 8);
            $relevante = true;
        }

        if ($this->contemTermo($texto, ['conflito', 'war', 'guerra', 'ataque', 'rotas comerciais', 'shipping'])) {
            $categorias[] = 'conflitos';
            $score = max($score, 7);
            $relevante = true;
        }

        if ($this->contemTermo($texto, ['eleicao', 'eleição', 'election'])) {
            $categorias[] = 'eleicoes';
            $score = max($score, 5);
            $relevante = true;
        }

        if ($this->contemTermo($texto, ['futebol', 'esporte', 'nba', 'tenis', 'tênis'])) {
            $relevante = false;
            $score = 1;
            $categorias = [];
        }

        return $this->enriquecerItem($item, [
            'relevante' => $relevante,
            'impact_score' => $score,
            'analise_ia' => $relevante
                ? 'Análise gerada localmente por fallback heurístico enquanto a integração externa não estava disponível.'
                : 'Item sem relevância geopolítica material para investidores brasileiros.',
            'regiao' => $this->inferirRegiao($texto),
            'categorias' => array_values(array_unique($categorias)),
        ]);
    }

    private function analiseNaoRelevante(): array
    {
        return [
            'relevante' => false,
            'impact_score' => 1,
            'impact_label' => 'MONITORAR',
            'analise_ia' => 'Item sem relevância geopolítica material para investidores brasileiros.',
            'regiao' => null,
            'categorias' => [],
        ];
    }

    private function mapearImpactLabel(int $impactScore): string
    {
        return match (true) {
            $impactScore >= 8 => 'CRÍTICO',
            $impactScore >= 6 => 'ALTO',
            $impactScore >= 4 => 'MÉDIO',
            default => 'MONITORAR',
        };
    }

    private function systemPrompt(): string
    {
        return (string) config('ai.prompts.analise_sistema');
    }

    private function userPrompt(array $itens): string
    {
        return json_encode([
            'instrucao' => 'Analise os itens abaixo e devolva somente o JSON array solicitado.',
            'itens' => $itens,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '[]';
    }

    private function contemTermo(string $texto, array $termos): bool
    {
        foreach ($termos as $termo) {
            if (str_contains($texto, $termo)) {
                return true;
            }
        }

        return false;
    }

    private function inferirRegiao(string $texto): ?string
    {
        return match (true) {
            $this->contemTermo($texto, ['china', 'japao', 'japão', 'india', 'índia']) => 'Ásia',
            $this->contemTermo($texto, ['europa', 'ue', 'russia', 'rússia', 'ukraine', 'ucrania', 'ucrânia']) => 'Europa',
            $this->contemTermo($texto, ['eua', 'united states', 'washington', 'canada', 'canadá']) => 'América do Norte',
            $this->contemTermo($texto, ['brasil', 'argentina', 'chile', 'colombia', 'colômbia']) => 'América Latina',
            $this->contemTermo($texto, ['oriente medio', 'oriente médio', 'iran', 'iraque', 'israel', 'arabia', 'arábia']) => 'Oriente Médio',
            $this->contemTermo($texto, ['africa', 'áfrica', 'nigeria', 'egito']) => 'África',
            default => null,
        };
    }
}
