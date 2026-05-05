<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarAssinantesRequest;
use App\Models\Plano;
use App\Services\AdminAssinanteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAssinanteController extends Controller
{
    public function __construct(
        private readonly AdminAssinanteService $adminAssinanteService,
    ) {
    }

    public function index(ListarAssinantesRequest $request): JsonResponse
    {
        return response()->json(
            $this->adminAssinanteService->listar($request->validated())
        );
    }

    public function trocarPlanoBulk(Request $request): JsonResponse
    {
        $slugsValidos = Plano::where('ativo', true)->pluck('slug')->toArray();

        $dados = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'plano' => ['required', 'string', Rule::in($slugsValidos)],
        ]);

        $resultado = $this->adminAssinanteService->trocarPlanoBulk($dados['ids'], $dados['plano']);

        return response()->json($resultado);
    }

    public function statusTrocaPlano(string $operacaoId): JsonResponse
    {
        return response()->json(
            $this->adminAssinanteService->statusTrocaPlano($operacaoId)
        );
    }

    public function reenviarBoasVindas(int $id): JsonResponse
    {
        $this->adminAssinanteService->reenviarBoasVindas($id);

        return response()->json(['message' => 'E-mail de boas-vindas reenviado com sucesso.']);
    }
}
