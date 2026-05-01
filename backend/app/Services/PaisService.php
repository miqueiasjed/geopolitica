<?php

namespace App\Services;

use App\Jobs\GerarPerfilPaisJob;
use App\Models\PerfilPais;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PaisService
{
    public function listar(?string $q): array
    {
        $chaveCache = 'paises_lista_v2_' . md5($q ?? '');

        return Cache::remember($chaveCache, 1800, function () use ($q) {
            return PerfilPais::query()
                ->when($q, fn ($query) => $query->where('nome_pt', $this->operadorBuscaTextual(), "%{$q}%"))
                ->orderBy('nome_pt')
                ->get(['codigo_pais', 'nome_pt', 'bandeira_emoji', 'regiao_geopolitica', 'gerado_em'])
                ->map(fn (PerfilPais $pais) => $pais->toArray())
                ->all();
        });
    }

    public function buscar(string $codigo): ?array
    {
        $chaveCache = "perfil_pais_v2_{$codigo}";

        $perfil = Cache::remember($chaveCache, 1800, function () use ($codigo) {
            return PerfilPais::where('codigo_pais', $codigo)->first()?->toArray();
        });

        if ($perfil && is_null($perfil['gerado_em'] ?? null)) {
            $this->acionarGeracaoPerfil($codigo);
        }

        return $perfil;
    }

    private function acionarGeracaoPerfil(string $codigo): void
    {
        $perfilPendente = PerfilPais::where('codigo_pais', $codigo)->first();

        if ($perfilPendente) {
            GerarPerfilPaisJob::dispatch($perfilPendente);
        }
    }

    private function operadorBuscaTextual(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
    }
}
