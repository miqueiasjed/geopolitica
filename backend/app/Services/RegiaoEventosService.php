<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Database\Eloquent\Collection;

class RegiaoEventosService
{
    public function buscarPorRegiao(string $regiao): Collection
    {
        return Event::relevantes()
            ->porRegiao($regiao)
            ->ultimas48h()
            ->orderBy('impact_score', 'desc')
            ->limit(10)
            ->get();
    }
}
