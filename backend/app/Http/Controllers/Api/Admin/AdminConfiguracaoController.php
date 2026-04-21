<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ConfiguracaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminConfiguracaoController extends Controller
{
    public function __construct(
        private readonly ConfiguracaoService $service
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->service->todos(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'configuracoes'   => ['required', 'array'],
            'configuracoes.*' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->service->atualizar($dados['configuracoes']);

        return response()->json([
            'message' => 'Configurações salvas com sucesso.',
            'data'    => $this->service->todos(),
        ]);
    }
}
