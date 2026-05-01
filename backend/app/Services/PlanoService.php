<?php

namespace App\Services;

use App\Models\Plano;
use App\Models\PlanoRecurso;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class PlanoService
{
    private const TTL_SEGUNDOS = 600;
    private const PREFIXO_CACHE = 'plano_recursos_';

    // -------------------------------------------------------------------------
    // Consultas de recursos
    // -------------------------------------------------------------------------

    /**
     * Retorna o valor bruto (string|null) de um recurso para o plano informado.
     */
    public function valorRecurso(string $slugPlano, string $chave): ?string
    {
        $recursos = $this->recursosDoPlano($slugPlano);

        return $recursos[$chave] ?? null;
    }

    /**
     * Retorna o limite inteiro de um recurso.
     * Retorna null quando o valor for null (ilimitado).
     */
    public function limiteInteiro(string $slugPlano, string $chave): ?int
    {
        $valor = $this->valorRecurso($slugPlano, $chave);

        if ($valor === null) {
            return null;
        }

        return (int) $valor;
    }

    /**
     * Retorna o valor boolean de um recurso.
     */
    public function recursoBoolean(string $slugPlano, string $chave): bool
    {
        $valor = $this->valorRecurso($slugPlano, $chave);

        return $valor === 'true';
    }

    /**
     * Retorna todos os recursos de um plano como array associativo chave => valor.
     * O resultado é cacheado no Redis por TTL_SEGUNDOS.
     */
    public function recursosDoPlano(string $slugPlano): array
    {
        $chaveCache = self::PREFIXO_CACHE . $slugPlano;

        return Cache::remember($chaveCache, self::TTL_SEGUNDOS, function () use ($slugPlano) {
            $plano = Plano::where('slug', $slugPlano)
                ->with('recursos')
                ->first();

            if (! $plano) {
                return [];
            }

            $recursos = [];
            foreach ($plano->recursos as $recurso) {
                $recursos[$recurso->chave] = $recurso->valor;
            }

            return $recursos;
        });
    }

    // -------------------------------------------------------------------------
    // Operações de escrita (admin)
    // -------------------------------------------------------------------------

    /**
     * Retorna todos os planos com seus recursos.
     */
    public function todos(): Collection
    {
        return Plano::with('recursos')->orderBy('ordem')->get();
    }

    /**
     * Atualiza um recurso específico de um plano.
     * Invalida o cache do plano após a escrita.
     */
    public function atualizarRecurso(int $planoId, string $chave, ?string $valor): PlanoRecurso
    {
        $plano = Plano::findOrFail($planoId);

        $recurso = PlanoRecurso::updateOrCreate(
            ['plano_id' => $planoId, 'chave' => $chave],
            ['valor' => $valor],
        );

        $this->invalidarCache($plano->slug);

        return $recurso->fresh();
    }

    /**
     * Cria um novo plano.
     */
    public function criarPlano(array $dados): Plano
    {
        return Plano::create($dados);
    }

    /**
     * Atualiza metadados de um plano (nome, descricao, preco, lastlink_url).
     * Invalida o cache do plano após a escrita.
     */
    public function atualizarPlano(int $planoId, array $dados): Plano
    {
        $plano = Plano::findOrFail($planoId);

        $plano->update($dados);

        $this->invalidarCache($plano->slug);

        return $plano->fresh();
    }

    // -------------------------------------------------------------------------
    // Invalidação de cache
    // -------------------------------------------------------------------------

    /**
     * Invalida o cache de um plano específico.
     */
    public function invalidarCache(string $slugPlano): void
    {
        Cache::forget(self::PREFIXO_CACHE . $slugPlano);
    }

    /**
     * Invalida o cache de todos os planos cadastrados.
     */
    public function invalidarTodoCache(): void
    {
        $slugs = Plano::pluck('slug');

        foreach ($slugs as $slug) {
            $this->invalidarCache($slug);
        }
    }
}
