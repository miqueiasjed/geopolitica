<?php

namespace App\Http\Controllers;

use App\Http\Requests\AtualizarPerfilRequest;
use App\Services\PerfilService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerfilController extends Controller
{
    public function __construct(
        private readonly PerfilService $perfilService,
    ) {
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->perfilService->obter($request->user()),
        ]);
    }

    public function update(AtualizarPerfilRequest $request): JsonResponse
    {
        return response()->json([
            'user' => $this->perfilService->atualizar($request->user(), $request->validated()),
        ]);
    }
}
