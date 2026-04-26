<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Source;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;
use Vedmant\FeedReader\FeedReader;

class RssFetcherService
{
    public function __construct(
        private readonly FeedReader $feedReader,
    ) {
    }

    public function fetchSource(Source $source): array
    {
        Log::channel('pipeline')->info('[RSS] Iniciando coleta da fonte.', [
            'source_id' => $source->id,
            'fonte' => $source->nome,
            'rss_url' => $source->rss_url,
        ]);

        try {
            $feed = $this->feedReader->read($source->rss_url);
            $items = $feed->get_items(0, config('feed.max_items_per_source', 50)) ?? [];

            $totalBruto = count($items);

            $itensColetados = collect($items)
                ->map(fn ($item) => $this->mapearItem($item, $source))
                ->filter()
                ->filter(fn (array $item) => $item['publicado_em']->greaterThanOrEqualTo(now()->subDay()))
                ->values();

            if ($itensColetados->isEmpty()) {
                Log::channel('pipeline')->info('[RSS] Fonte sem itens recentes (últimas 24h).', [
                    'fonte' => $source->nome,
                    'total_bruto' => $totalBruto,
                ]);

                $source->forceFill(['ultima_coleta_em' => now()])->save();

                return [];
            }

            $urlsExistentes = Event::query()
                ->whereIn('fonte_url', $itensColetados->pluck('fonte_url'))
                ->pluck('fonte_url')
                ->all();

            $source->forceFill(['ultima_coleta_em' => now()])->save();

            $novos = $itensColetados
                ->reject(fn (array $item) => in_array($item['fonte_url'], $urlsExistentes, true))
                ->map(function (array $item) {
                    $item['publicado_em'] = $item['publicado_em']->toIso8601String();

                    return $item;
                })
                ->values()
                ->all();

            Log::channel('pipeline')->info('[RSS] Coleta da fonte concluída.', [
                'fonte' => $source->nome,
                'total_bruto' => $totalBruto,
                'recentes_24h' => $itensColetados->count(),
                'ja_existem_no_banco' => count($urlsExistentes),
                'novos_para_processar' => count($novos),
            ]);

            return $novos;
        } catch (\Throwable $throwable) {
            Log::warning('Falha ao coletar feed RSS.', [
                'source_id' => $source->id,
                'rss_url' => $source->rss_url,
                'erro' => $throwable->getMessage(),
            ]);
            Log::channel('pipeline')->error('[RSS] ERRO ao coletar fonte.', [
                'source_id' => $source->id,
                'fonte' => $source->nome,
                'rss_url' => $source->rss_url,
                'erro' => $throwable->getMessage(),
                'classe_erro' => get_class($throwable),
            ]);

            $source->forceFill(['ultima_coleta_em' => now()])->save();

            return [];
        }
    }

    private function mapearItem(object $item, Source $source): ?array
    {
        $link = $item->get_link();
        $dataPublicacao = $item->get_date(DATE_ATOM) ?: $item->get_date('c');

        if (! $link || ! $dataPublicacao) {
            return null;
        }

        return [
            'titulo' => trim((string) $item->get_title()),
            'resumo' => trim(strip_tags((string) $item->get_description())),
            'fonte_url' => $link,
            'fonte' => $source->nome,
            'publicado_em' => CarbonImmutable::parse($dataPublicacao),
        ];
    }
}
