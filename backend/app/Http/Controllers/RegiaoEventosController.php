<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegiaoEventosRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RegiaoEventosController extends Controller
{
    public function index(RegiaoEventosRequest $request): AnonymousResourceCollection
    {
        $regiao = $request->validated()['regiao'];

        $eventos = Event::relevantes()
            ->porRegiao($regiao)
            ->ultimas48h()
            ->orderBy('impact_score', 'desc')
            ->limit(10)
            ->get();

        return EventResource::collection($eventos);
    }
}
