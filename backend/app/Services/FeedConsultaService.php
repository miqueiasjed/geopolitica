<?php

namespace App\Services;

use App\Models\Event;
use App\Models\User;
use Illuminate\Contracts\Pagination\CursorPaginator;

class FeedConsultaService
{
    public function listar(User $usuario, array $filtros): CursorPaginator
    {
        $limite = $this->resolverLimite($usuario, $filtros);

        return Event::query()
            ->relevantes()
            ->when(! $usuario->hasRole(['assinante_reservado', 'admin']), fn ($query) => $query->ultimas48h())
            ->when($filtros['categoria'] ?? null, fn ($query, $categoria) => $query->whereJsonContains('categorias', $categoria))
            ->when($filtros['regiao'] ?? null, fn ($query, $regiao) => $query->porRegiao($regiao))
            ->when($filtros['label'] ?? null, fn ($query, $label) => $query->where('impact_label', $label))
            ->orderByDesc('publicado_em')
            ->orderByDesc('id')
            ->cursorPaginate(
                perPage: $limite,
                cursorName: 'cursor',
                cursor: $filtros['cursor'] ?? null,
            );
    }

    private function resolverLimite(User $usuario, array $filtros): int
    {
        $limite = (int) ($filtros['limite'] ?? 20);

        if ($usuario->hasRole('assinante_essencial')) {
            return min($limite, 20);
        }

        return $limite;
    }
}
