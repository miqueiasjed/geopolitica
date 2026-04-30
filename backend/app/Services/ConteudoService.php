<?php

namespace App\Services;

use App\Http\Resources\ConteudoCardResource;
use App\Models\Conteudo;
use App\Models\User;

class ConteudoService
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function listar(array $filtros, User $usuario): array
    {
        $limite = min((int) ($filtros['limite'] ?? 20), 50);
        $cursor = (int) ($filtros['cursor'] ?? 0);
        $role   = $usuario->getRoleNames()->first() ?? 'assinante_essencial';

        $diasHistorico = $usuario->hasRole('admin')
            ? null
            : $this->planoService->limiteInteiro($usuario->assinante?->plano ?? 'essencial', 'conteudo_historico_dias');

        $query = Conteudo::query()
            ->publicados()
            ->acessivelPor($role, $diasHistorico)
            ->when($cursor > 0, fn ($q) => $q->where('id', '>', $cursor))
            ->orderBy('id', 'asc');

        if ($busca = $filtros['q'] ?? null) {
            $query->whereRaw('MATCH(titulo, corpo) AGAINST(? IN BOOLEAN MODE)', [$busca]);
        }

        if ($tipo = $filtros['tipo'] ?? null) {
            $query->where('tipo', $tipo);
        }

        if ($regiao = $filtros['regiao'] ?? null) {
            $query->where('regiao', $regiao);
        }

        if ($vertical = $filtros['vertical'] ?? null) {
            $query->where('vertical_conteudo', $vertical);
        }

        if ($de = $filtros['de'] ?? null) {
            $query->where('publicado_em', '>=', $de);
        }

        if ($ate = $filtros['ate'] ?? null) {
            $query->where('publicado_em', '<=', $ate);
        }

        $itens = $query->limit($limite + 1)->get();

        $proximoCursor = null;
        if ($itens->count() > $limite) {
            $itens->pop();
            $proximoCursor = $itens->last()?->id;
        }

        return [
            'data'        => ConteudoCardResource::collection($itens)->resolve(),
            'next_cursor' => $proximoCursor,
        ];
    }

    public function buscarPorSlug(string $slug, User $usuario): ?Conteudo
    {
        $conteudo = Conteudo::query()
            ->publicados()
            ->where('slug', $slug)
            ->first();

        if (! $conteudo) {
            return null;
        }

        if ($usuario->hasRole('admin')) {
            return $conteudo;
        }

        $slugPlano     = $usuario->assinante?->plano ?? 'essencial';
        $role          = $usuario->getRoleNames()->first() ?? 'assinante_essencial';
        $diasHistorico = $this->planoService->limiteInteiro($slugPlano, 'conteudo_historico_dias');

        $planosPermitidos = match ($role) {
            'assinante_pro'                => ['essencial', 'pro'],
            'assinante_reservado'          => ['essencial', 'pro', 'reservado'],
            default                        => ['essencial'],
        };

        if (! in_array($conteudo->plano_minimo, $planosPermitidos, true)) {
            return null;
        }

        if ($diasHistorico !== null && $conteudo->publicado_em < now()->subDays($diasHistorico)) {
            return null;
        }

        return $conteudo;
    }

    public function criar(array $dados): Conteudo
    {
        $dados['slug'] = Conteudo::gerarSlug($dados['titulo']);

        return Conteudo::create($dados);
    }

    public function atualizar(Conteudo $conteudo, array $dados): Conteudo
    {
        if (($dados['publicado'] ?? false) && $conteudo->publicado_em === null) {
            $dados['publicado_em'] = now();
        }

        $conteudo->update($dados);

        return $conteudo->fresh();
    }

    public function despublicar(Conteudo $conteudo): Conteudo
    {
        $conteudo->update(['publicado' => false]);

        return $conteudo->fresh();
    }
}
