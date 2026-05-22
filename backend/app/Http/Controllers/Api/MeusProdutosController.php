<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssinanteAddon;
use App\Models\Produto;
use App\Services\PlanoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeusProdutosController extends Controller
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user      = $request->user();
        $assinante = $user->assinante;
        $isAdmin   = $user->role === 'admin' || $user->hasRole('admin');

        $produtos = Produto::ativo()->ordenado()->get();

        $dados = $produtos->map(function (Produto $produto) use ($user, $assinante, $isAdmin) {
            $statusUsuario = $this->resolverStatus($user->id, $produto, $assinante, $isAdmin);

            return [
                'chave'          => $produto->chave,
                'nome'           => $produto->nome,
                'descricao'      => $produto->descricao,
                'preco_label'    => $produto->preco_label,
                'link_compra'    => $produto->link_compra,
                'link_reativar'  => $produto->link_reativar,
                'status_usuario' => $statusUsuario,
            ];
        });

        return response()->json($dados);
    }

    private function resolverStatus(int $userId, Produto $produto, $assinante, bool $isAdmin): ?string
    {
        if ($isAdmin) {
            return 'ativo';
        }

        // temAddon verifica assinantes.addons E assinante_addons (status=ativo)
        if ($assinante?->temAddon($produto->chave)) {
            return 'ativo';
        }

        if ($produto->recurso_plano && $assinante) {
            if ($this->planoService->recursoBoolean($assinante->plano, $produto->recurso_plano)) {
                return 'ativo';
            }
        }

        // Retorna status não-ativo (cancelado/expirado/reembolsado) para o CTA correto
        return AssinanteAddon::where('user_id', $userId)
            ->where('addon_key', $produto->chave)
            ->whereIn('status', ['cancelado', 'expirado', 'reembolsado'])
            ->latest('iniciado_em')
            ->value('status');
    }
}
