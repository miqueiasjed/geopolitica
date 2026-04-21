<?php

namespace App\Services;

use App\Models\Event;
use App\Models\PerfilPais;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EventosPaisService
{
    public function buscarEventosRecentes(PerfilPais $pais, int $dias = 7): Collection
    {
        $termos = $pais->termos_busca ?? [];

        if (empty($termos)) {
            return new Collection;
        }

        $operador = $this->operadorBuscaTextual();

        return Event::query()
            ->where(function ($query) use ($termos, $operador) {
                foreach ($termos as $termo) {
                    $query->orWhere('titulo', $operador, "%{$termo}%")
                          ->orWhere('resumo', $operador, "%{$termo}%");
                }
            })
            ->where('created_at', '>=', now()->subDays($dias))
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }

    private function operadorBuscaTextual(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
    }
}
