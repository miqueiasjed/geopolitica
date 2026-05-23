<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AtualizarPlanoRecursoRequest;
use App\Http\Requests\Admin\AtualizarPlanoRequest;
use App\Http\Requests\Admin\CriarPlanoRequest;
use App\Models\Plano;
use App\Services\PlanoService;
use Illuminate\Http\JsonResponse;

class AdminPlanoController extends Controller
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    /**
     * Lista todos os planos com seus recursos.
     */
    public function index(): JsonResponse
    {
        $planos = $this->planoService->todos();

        $dados = $planos->map(function (Plano $plano) {
            $recursos = [];

            foreach ($plano->recursos as $recurso) {
                $recursos[$recurso->chave] = $recurso->valor;
            }

            return [
                'id'                  => $plano->id,
                'slug'                => $plano->slug,
                'nome'                => $plano->nome,
                'descricao'           => $plano->descricao,
                'preco'               => $plano->preco,
                'ordem'               => $plano->ordem,
                'ativo'               => $plano->ativo,
                'exibir_no_upgrade'   => $plano->exibir_no_upgrade,
                'lastlink_url'        => $plano->lastlink_url,
                'role'                => $plano->role,
                'product_id_hotmart'  => $plano->product_id_hotmart,
                'product_id_lastlink' => $plano->product_id_lastlink,
                'recursos'            => $recursos,
            ];
        });

        return response()->json(['data' => $dados]);
    }

    /**
     * Cria um novo plano.
     */
    public function store(CriarPlanoRequest $request): JsonResponse
    {
        $dados = $request->validated();

        $plano = $this->planoService->criarPlano($dados);

        return response()->json(['data' => $plano], 201);
    }

    /**
     * Atualiza os metadados de um plano.
     */
    public function update(AtualizarPlanoRequest $request, Plano $plano): JsonResponse
    {
        $planoAtualizado = $this->planoService->atualizarPlano(
            $plano->id,
            $request->validated(),
        );

        return response()->json(['data' => $planoAtualizado]);
    }

    /**
     * Exclui um plano.
     */
    public function destroy(Plano $plano): JsonResponse
    {
        try {
            $this->planoService->excluirPlano($plano);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(null, 204);
    }

    /**
     * Atualiza um recurso específico de um plano.
     */
    public function atualizarRecurso(AtualizarPlanoRecursoRequest $request, Plano $plano, string $chave): JsonResponse
    {
        $validados = $request->validated();

        $recurso = $this->planoService->atualizarRecurso(
            $plano->id,
            $chave,
            $validados['valor'] ?? null,
        );

        return response()->json(['data' => $recurso]);
    }
}
