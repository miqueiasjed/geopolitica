<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListarAssinantesRequest;
use App\Models\AssinanteAddon;
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

    public function resetarPrimeiroAcesso(int $id): JsonResponse
    {
        $this->adminAssinanteService->resetarPrimeiroAcesso($id);

        return response()->json(['message' => 'Senha aleatória gerada e enviada por e-mail ao assinante.']);
    }

    public function criarAddonUsuario(Request $request): JsonResponse
    {
        $slugsValidos = Plano::where('ativo', true)->pluck('slug')->toArray();

        $dados = $request->validate([
            'nome'         => ['required', 'string', 'max:255'],
            'email'        => ['required', 'email', 'max:255', 'unique:users,email'],
            'addon_key'    => ['nullable', 'string', Rule::in(AssinanteAddon::ADDON_KEYS)],
            'plano'        => ['nullable', 'string', Rule::in($slugsValidos)],
            'expira_em'    => ['nullable', 'date', 'after:today'],
            'enviar_email' => ['boolean'],
        ]);

        if (empty($dados['addon_key']) && empty($dados['plano'])) {
            return response()->json(['message' => 'Informe ao menos um plano ou um addon.'], 422);
        }

        try {
            $resultado = $this->adminAssinanteService->criarAddonUsuario($dados);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($resultado, 201);
    }

    public function reenviarBoasVindas(int $id): JsonResponse
    {
        $this->adminAssinanteService->reenviarBoasVindas($id);

        return response()->json(['message' => 'E-mail de boas-vindas reenviado com sucesso.']);
    }

    public function atualizar(Request $request, int $id): JsonResponse
    {
        $dados = $request->validate([
            'ativo'     => ['sometimes', 'boolean'],
            'status'    => ['sometimes', 'string', Rule::in(['ativo', 'pendente', 'cancelado', 'expirado', 'reembolsado', 'chargeback'])],
            'expira_em' => ['sometimes', 'nullable', 'date'],
        ]);

        $assinante = $this->adminAssinanteService->atualizarAssinante($id, $dados);

        return response()->json([
            'message'   => 'Assinante atualizado com sucesso.',
            'id'        => $assinante->id,
            'ativo'     => $assinante->ativo,
            'status'    => $assinante->status,
            'expira_em' => $assinante->expira_em?->toIso8601String(),
        ]);
    }
}
