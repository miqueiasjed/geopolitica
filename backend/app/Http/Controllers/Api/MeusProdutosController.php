<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssinanteAddon;
use App\Models\Produto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeusProdutosController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user      = $request->user();
        $assinante = $user->assinante;
        $isAdmin   = $user->role === 'admin' || $user->hasRole('admin');

        $produtos = Produto::ativo()->ordenado()->get();

        $dados = $produtos->map(function (Produto $produto) use ($user, $assinante, $isAdmin) {
            $statusUsuario = $this->resolverStatus($user->id, $produto, $isAdmin, $assinante);

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

    private function resolverStatus(int $userId, Produto $produto, bool $isAdmin, $assinante): ?string
    {
        if ($isAdmin) {
            return 'ativo';
        }

        if ($assinante?->temAddon($produto->chave)) {
            return 'ativo';
        }

        // Status não-ativo para CTA correto (Reativar / Renovar / Assinar)
        return AssinanteAddon::where('user_id', $userId)
            ->where('addon_key', $produto->chave)
            ->whereIn('status', ['cancelado', 'expirado', 'reembolsado'])
            ->latest('iniciado_em')
            ->value('status');
    }
}
