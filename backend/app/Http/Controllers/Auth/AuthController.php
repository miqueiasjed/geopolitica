<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Auth\AutenticacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AutenticacaoService $autenticacaoService,
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $resultado = $this->autenticacaoService->fazerLogin($request->validated());

        return response()->json($resultado, 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->autenticacaoService->encerrarSessao($request->user());

        return response()->json(status: 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->autenticacaoService->obterUsuarioAutenticado($request->user()),
        ]);
    }
}
