<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BibliotecaFiltroRequest;
use App\Services\ConteudoService;
use Illuminate\Http\JsonResponse;

class BibliotecaController extends Controller
{
    public function __construct(
        private readonly ConteudoService $conteudoService,
    ) {
    }

    public function index(BibliotecaFiltroRequest $request): JsonResponse
    {
        $resultado = $this->conteudoService->listar($request->validated(), $request->user());

        return response()->json([
            'data'        => $resultado['data'],
            'next_cursor' => $resultado['next_cursor'],
        ]);
    }
}
