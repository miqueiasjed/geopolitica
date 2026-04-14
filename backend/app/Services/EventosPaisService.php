<?php

namespace App\Services;

use App\Models\Event;
use App\Models\PerfilPais;
use Illuminate\Database\Eloquent\Collection;

class EventosPaisService
{
    public function buscarEventosRecentes(PerfilPais $pais, int $dias = 7): Collection
    {
        $termos = $pais->termos_busca;

        if (empty($termos)) {
            return new Collection;
        }

        return Event::query()
            ->where(function ($query) use ($termos) {
                foreach ($termos as $termo) {
                    $query->orWhere('titulo', 'ILIKE', "%{$termo}%")
                          ->orWhere('resumo', 'ILIKE', "%{$termo}%");
                }
            })
            ->where('created_at', '>=', now()->subDays($dias))
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }
}
