<?php

namespace App\Services;

use App\Http\Resources\ConteudoCardResource;
use App\Models\Conteudo;

class ConteudoService
{
    public function listar(array $filtros, string $role): array
    {
        $limite = min((int) ($filtros['limite'] ?? 20), 50);
        $cursor = (int) ($filtros['cursor'] ?? 0);

        $query = Conteudo::query()
            ->publicados()
            ->acessivelPor($role)
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

    public function buscarPorSlug(string $slug, string $role): ?Conteudo
    {
        $conteudo = Conteudo::query()
            ->publicados()
            ->where('slug', $slug)
            ->first();

        if (! $conteudo) {
            return null;
        }

        $temAcesso = match ($role) {
            'assinante_essencial' => $conteudo->plano_minimo === 'essencial'
                && $conteudo->publicado_em >= now()->subDays(90),

            'assinante_pro' => in_array($conteudo->plano_minimo, ['essencial', 'pro'])
                && $conteudo->publicado_em >= now()->subDays(90),

            'assinante_reservado', 'admin' => true,

            default => false,
        };

        return $temAcesso ? $conteudo : null;
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
