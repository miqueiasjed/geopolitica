<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdicionarPaisRequest;
use App\Services\PaisUsuarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaisUsuarioController extends Controller
{
    public function __construct(
        private readonly PaisUsuarioService $paisUsuarioService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paisesSeguidos = $this->paisUsuarioService->listar($request->user()->id);

        return response()->json(['data' => $paisesSeguidos]);
    }

    public function store(AdicionarPaisRequest $request): JsonResponse
    {
        $paisUsuario = $this->paisUsuarioService->adicionar(
            $request->user(),
            $request->validated('codigo_pais'),
        );

        return response()->json(['data' => $paisUsuario], 201);
    }

    public function destroy(Request $request, string $codigo): JsonResponse
    {
        $removido = $this->paisUsuarioService->remover($request->user()->id, $codigo);

        if (! $removido) {
            return response()->json(['message' => 'Sem permissão para remover este país.'], 403);
        }

        return response()->json(null, 204);
    }
}
