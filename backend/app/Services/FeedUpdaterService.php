<?php

namespace App\Services;

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
    ) {
    }

    public function atualizar(): array
    {
        $itensColetados = Source::query()
            ->ativos()
            ->get()
            ->flatMap(fn (Source $source) => $this->rssFetcherService->fetchSource($source))
            ->values();

        $itensAnalisados = $itensColetados
            ->chunk(5)
            ->flatMap(fn (Collection $lote) => $this->aiAnalyzerService->analisar($lote->all()))
            ->values();

        $salvos = 0;

        foreach ($itensAnalisados as $item) {
            try {
                Event::query()->create([
                    'titulo' => $item['titulo'],
                    'resumo' => $item['resumo'],
                    'analise_ia' => $item['analise_ia'] ?? null,
                    'fonte' => $item['fonte'],
                    'fonte_url' => $item['fonte_url'],
                    'regiao' => $item['regiao'] ?? null,
                    'impact_score' => $item['impact_score'] ?? 1,
                    'impact_label' => $item['impact_label'] ?? 'MONITORAR',
                    'categorias' => $item['categorias'] ?? [],
                    'relevante' => $item['relevante'] ?? false,
                    'publicado_em' => $item['publicado_em'],
                ]);

                $salvos++;
            } catch (QueryException $exception) {
                Log::warning('Falha ao persistir evento do feed.', [
                    'fonte_url' => $item['fonte_url'] ?? null,
                    'erro' => $exception->getMessage(),
                ]);
            }
        }

        $resultado = [
            'coletados' => $itensColetados->count(),
            'novos' => $itensAnalisados->count(),
            'salvos' => $salvos,
        ];

        if ($resultado['salvos'] < $resultado['novos']) {
            Log::warning('Nem todos os eventos analisados foram persistidos.', $resultado);
        }

        return $resultado;
    }
}
