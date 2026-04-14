<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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
        return Cache::remember(
            self::CHAVE_CACHE,
            now()->addMinutes(self::TTL_MINUTOS),
            fn () => DB::table('mapa_intensidade')->get()->toArray()
        );
    }

    /**
     * Invalida o cache Redis do mapa de intensidade.
     */
    public function invalidar(): void
    {
        Cache::forget(self::CHAVE_CACHE);
    }
}
