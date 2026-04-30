<?php

namespace App\Services;

use App\Models\Event;
use App\Models\User;
use Illuminate\Contracts\Pagination\CursorPaginator;

class FeedConsultaService
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function listar(User $usuario, array $filtros): CursorPaginator
    {
        $limite = $this->resolverLimite($usuario, $filtros);
        $diasHistorico = $this->resolverDiasHistorico($usuario);

        return Event::query()
            ->relevantes()
            ->when($diasHistorico !== null, fn ($query) => $query->where('publicado_em', '>=', now()->subDays($diasHistorico)))
            ->when($filtros['categoria'] ?? null, fn ($query, $categoria) => $query->whereJsonContains('categorias', $categoria))
            ->when($filtros['regiao'] ?? null, fn ($query, $regiao) => $query->porRegiao($regiao))
            ->when($filtros['label'] ?? null, fn ($query, $label) => $query->where('impact_label', $label))
            ->orderByDesc('brazil_impact_score')
            ->orderByDesc('publicado_em')
            ->orderByDesc('id')
            ->cursorPaginate(
                perPage: $limite,
                cursorName: 'cursor',
                cursor: $filtros['cursor'] ?? null,
            );
    }

    private function resolverDiasHistorico(User $usuario): ?int
    {
        if ($usuario->hasRole('admin')) {
            return null;
        }

        $slugPlano = $usuario->assinante?->plano ?? 'essencial';

        return $this->planoService->limiteInteiro($slugPlano, 'feed_historico_dias');
    }

    private function resolverLimite(User $usuario, array $filtros): int
    {
        $requestedLimite = (int) ($filtros['limite'] ?? 20);

        if ($usuario->hasRole('admin')) {
            return $requestedLimite;
        }

        $slugPlano  = $usuario->assinante?->plano ?? 'essencial';
        $maxLimite  = $this->planoService->limiteInteiro($slugPlano, 'feed_paginacao_limite');

        return $maxLimite !== null ? min($requestedLimite, $maxLimite) : $requestedLimite;
    }
}
