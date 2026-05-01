<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegiaoEventosRequest;
use App\Http\Resources\EventResource;
use App\Services\RegiaoEventosService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RegiaoEventosController extends Controller
{
    public function __construct(
        private readonly RegiaoEventosService $regiaoEventosService,
    ) {}

    public function index(RegiaoEventosRequest $request): AnonymousResourceCollection
    {
        $eventos = $this->regiaoEventosService->buscarPorRegiao($request->validated('regiao'));

        return EventResource::collection($eventos);
    }
}
