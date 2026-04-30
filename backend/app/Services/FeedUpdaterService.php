<?php

namespace App\Services;

use App\Models\ContentCache;
use App\Models\Event;
use App\Models\Source;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class FeedUpdaterService
{
    public function __construct(
        private readonly RssFetcherService $rssFetcherService,
        private readonly AiAnalyzerService $aiAnalyzerService,
        private readonly EditorialService $editorialService,
    ) {}

    public function atualizar(string $tier = 'A'): array
    {
        if ($tier === 'B') {
            return $this->atualizarTierB();
        }

        $fontes = Source::query()->ativos()->tier($tier)->get();

        Log::channel('pipeline')->info('[FeedUpdater] Fontes ativas encontradas.', [
            'total_fontes' => $fontes->count(),
            'fontes' => $fontes->pluck('nome', 'id')->toArray(),
        ]);

        if ($fontes->isEmpty()) {
            Log::channel('pipeline')->warning('[FeedUpdater] Nenhuma fonte ativa cadastrada. Nada a coletar.');
        }

        $itensColetados = $fontes
            ->flatMap(fn (Source $source) => $this->rssFetcherService->fetchSource($source))
            ->values();

        Log::channel('pipeline')->info('[FeedUpdater] Coleta RSS concluída.', [
            'total_itens_coletados' => $itensColetados->count(),
        ]);

        if ($itensColetados->isEmpty()) {
            Log::channel('pipeline')->warning('[FeedUpdater] Nenhum item novo coletado do RSS. Possíveis causas: fontes sem itens recentes, todos já existem no banco, ou erro de rede.');

            return ['coletados' => 0, 'novos' => 0, 'salvos' => 0];
        }

        $itensAnalisados = $itensColetados
            ->chunk(5)
            ->flatMap(fn (Collection $lote) => $this->aiAnalyzerService->analisar($lote->all()))
            ->values();

        Log::channel('pipeline')->info('[FeedUpdater] Análise IA concluída.', [
            'total_analisados' => $itensAnalisados->count(),
            'relevantes' => $itensAnalisados->where('relevante', true)->count(),
            'nao_relevantes' => $itensAnalisados->where('relevante', false)->count(),
        ]);

        $salvos = 0;

        foreach ($itensAnalisados as $item) {
            try {
                $event = Event::query()->create([
                    'titulo' => $item['titulo'],
                    'resumo' => $item['resumo'],
                    'analise_ia' => $item['analise_ia'] ?? null,
                    'fonte' => $item['fonte'],
                    'fonte_url' => $item['fonte_url'],
                    'regiao' => $item['regiao'] ?? null,
                    'impact_score' => $item['impact_score'] ?? 1,
                    'impact_label' => $item['impact_label'] ?? 'MONITORAR',
                    'brazil_impact_score' => $item['brazil_impact_score'] ?? 5,
                    'categorias' => $item['categorias'] ?? [],
                    'relevante' => $item['relevante'] ?? false,
                    'publicado_em' => $item['publicado_em'],
                ]);

                $salvos++;

                if ($event->relevante) {
                    $this->gerarEditorial($event);
                }
            } catch (QueryException $exception) {
                Log::warning('Falha ao persistir evento do feed.', [
                    'fonte_url' => $item['fonte_url'] ?? null,
                    'erro' => $exception->getMessage(),
                ]);
                Log::channel('pipeline')->error('[FeedUpdater] Falha ao persistir evento.', [
                    'fonte_url' => $item['fonte_url'] ?? null,
                    'titulo' => $item['titulo'] ?? null,
                    'erro' => $exception->getMessage(),
                ]);
            }
        }

        $resultado = [
            'coletados' => $itensColetados->count(),
            'novos' => $itensAnalisados->count(),
            'salvos' => $salvos,
        ];

        Log::channel('pipeline')->info('[FeedUpdater] Persistência concluída.', $resultado);

        if ($resultado['salvos'] < $resultado['novos']) {
            Log::warning('Nem todos os eventos analisados foram persistidos.', $resultado);
        }

        return $resultado;
    }

    private function atualizarTierB(): array
    {
        $fontes = Source::query()->ativos()->tier('B')->get();

        Log::channel('pipeline')->info('[FeedUpdater] Tier B — Fontes ativas encontradas.', [
            'total_fontes' => $fontes->count(),
        ]);

        if ($fontes->isEmpty()) {
            return ['coletados' => 0, 'novos' => 0, 'salvos' => 0];
        }

        $itensColetados = $fontes
            ->flatMap(fn (Source $source) => $this->rssFetcherService->fetchSource($source))
            ->values();

        $urlsExistentes = ContentCache::query()
            ->whereIn('url', $itensColetados->pluck('fonte_url'))
            ->pluck('url')
            ->all();

        $novos = $itensColetados->reject(
            fn (array $item) => in_array($item['fonte_url'], $urlsExistentes, true)
        );

        $salvos = 0;

        foreach ($novos as $item) {
            try {
                ContentCache::query()->create([
                    'fonte'        => $item['fonte'],
                    'url'          => $item['fonte_url'],
                    'titulo'       => $item['titulo'],
                    'excerpt'      => $item['resumo'] ?? null,
                    'publicado_em' => $item['publicado_em'],
                ]);
                $salvos++;
            } catch (QueryException) {
                // URL já existe — ignorar
            }
        }

        $resultado = [
            'coletados' => $itensColetados->count(),
            'novos' => $novos->count(),
            'salvos' => $salvos,
        ];

        Log::channel('pipeline')->info('[FeedUpdater] Tier B — Persistência concluída.', $resultado);

        return $resultado;
    }

    private function gerarEditorial(Event $event): void
    {
        try {
            $editorial = $this->editorialService->gerar($event);

            $event->update([
                'headline' => $editorial['headline'] ?: null,
                'legenda'  => $editorial['legenda'] ?: null,
            ]);

            Log::channel('pipeline')->info('[FeedUpdater] Editorial gerado.', [
                'event_id' => $event->id,
            ]);
        } catch (\Throwable $e) {
            Log::channel('pipeline')->warning('[FeedUpdater] Falha ao gerar editorial — evento salvo sem editorial.', [
                'event_id' => $event->id,
                'erro' => $e->getMessage(),
            ]);
        }
    }
}
