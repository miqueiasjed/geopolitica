<?php

namespace App\Services;

use App\Models\CriseHistorica;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class TimelineService
{
    private const TTL_CACHE = 86400;

    public function listarCrises(?int $periodoInicio, ?int $periodoFim, ?string $categoria): mixed
    {
        $chave = 'timeline_crises_' . md5(serialize([$periodoInicio, $periodoFim, $categoria]));

        return Cache::remember($chave, self::TTL_CACHE, function () use ($periodoInicio, $periodoFim, $categoria) {
            $query = CriseHistorica::query();

            if ($categoria) {
                $query->porCategoria($categoria);
            }

            if ($periodoInicio && $periodoFim) {
                $query->porPeriodo($periodoInicio, $periodoFim);
            }

            return $query->orderBy('data_inicio')
                ->get(['id', 'titulo', 'slug', 'ano', 'data_inicio', 'data_fim', 'categorias', 'content_slug']);
        });
    }

    public function listarEventos(?int $periodoInicio, ?int $periodoFim): mixed
    {
        $dataInicio = $periodoInicio
            ? Carbon::create($periodoInicio, 1, 1)
            : now()->subDays(365);

        $dataFim = $periodoFim
            ? Carbon::create($periodoFim, 12, 31)
            : now();

        return Event::whereBetween('created_at', [$dataInicio, $dataFim])
            ->orderBy('created_at')
            ->limit(100)
            ->get(['id', 'titulo', 'impact_score', 'impact_label', 'created_at']);
    }

    public function buscarCrisePorSlug(string $slug): ?CriseHistorica
    {
        return Cache::remember("timeline_crise_{$slug}", self::TTL_CACHE, function () use ($slug) {
            return CriseHistorica::where('slug', $slug)->first();
        });
    }
}
