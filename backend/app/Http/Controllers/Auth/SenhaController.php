<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AlterarSenhaInicialRequest;
use App\Http\Requests\Auth\EsqueciSenhaRequest;
use App\Http\Requests\Auth\RedefinirSenhaRequest;
use App\Services\Auth\SenhaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SenhaController extends Controller
{
    public function __construct(
        private readonly SenhaService $senhaService,
    ) {
    }

    public function esqueci(EsqueciSenhaRequest $request): JsonResponse
    {
        $resultado = $this->senhaService->enviarLinkRedefinicao($request->validated('email'));

        return response()->json($resultado, 200);
    }

    public function redefinir(RedefinirSenhaRequest $request): JsonResponse
    {
        $resultado = $this->senhaService->redefinirSenha($request->validated());

        return response()->json($resultado, 200);
    }

    public function alterarInicial(AlterarSenhaInicialRequest $request): JsonResponse
    {
        $usuario = $request->user();

        $usuario->password           = $request->validated('password');
        $usuario->deve_alterar_senha = false;
        $usuario->save();

        return response()->json(['message' => 'Senha alterada com sucesso.']);
    }
}
