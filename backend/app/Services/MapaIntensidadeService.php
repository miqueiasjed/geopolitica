<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MapaIntensidadeService
{
    private const CHAVE_CACHE = 'mapa:intensidade';
    private const TTL_MINUTOS = 15;

    /**
     * Retorna os dados do mapa de intensidade com cache Redis de 15 minutos.
     *
     * @return array
     */
    public function obter(): array
    {
        $emCache = Cache::has(self::CHAVE_CACHE);

        $dados = Cache::remember(
            self::CHAVE_CACHE,
            now()->addMinutes(self::TTL_MINUTOS),
            function () {
                $paises = DB::table('mapa_intensidade')->get();
                Log::channel('pipeline')->info('[MapaIntensidade] Dados buscados do banco.', [
                    'total_paises' => $paises->count(),
                ]);

                return ['paises' => $paises->toArray()];
            }
        );

        if ($emCache) {
            Log::channel('pipeline')->info('[MapaIntensidade] Dados servidos do cache Redis.', [
                'total_paises' => count($dados['paises'] ?? []),
            ]);
        }

        return $dados;
    }

    /**
     * Invalida o cache Redis do mapa de intensidade.
     */
    public function invalidar(): void
    {
        Cache::forget(self::CHAVE_CACHE);
    }
}
