<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Support\Collection;

class WarFeedService
{
    public function buscarFeed(array $filtros): array
    {
        $limite = min((int) ($filtros['limit'] ?? 20), 50);
        $cursor = $filtros['cursor'] ?? null;

        $query = Event::query()
            ->where('relevante', true)
            ->where(function ($q) {
                $q->whereRaw("JSON_SEARCH(categorias, 'one', 'military') IS NOT NULL")
                  ->orWhereIn('impact_label', ['CRÍTICO', 'ALTO']);
            })
            ->orderByDesc('impact_score')
            ->orderByDesc('publicado_em');

        if ($cursor !== null) {
            $query->where('publicado_em', '<', $cursor);
        }

        $itens = $query->limit($limite + 1)->get();

        $proximoCursor = null;
        if ($itens->count() > $limite) {
            $itens->pop();
            $proximoCursor = $itens->last()?->publicado_em?->toIso8601String();
        }

        return [
            'events'     => $itens->map(fn ($e) => [
                'id'           => $e->id,
                'titulo'       => $e->titulo,
                'resumo'       => $e->resumo,
                'fonte'        => $e->fonte,
                'fonte_url'    => $e->fonte_url,
                'regiao'       => $e->regiao,
                'impact_score' => $e->impact_score,
                'impact_label' => $e->impact_label,
                'categorias'   => $e->categorias ?? [],
                'publicado_em' => $e->publicado_em?->toIso8601String(),
            ])->values()->all(),
            'nextCursor' => $proximoCursor,
        ];
    }
}
