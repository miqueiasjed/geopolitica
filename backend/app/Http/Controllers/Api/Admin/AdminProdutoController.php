<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AtualizarProdutoRequest;
use App\Http\Requests\Admin\CriarProdutoRequest;
use App\Models\Assinante;
use App\Models\AssinanteAddon;
use App\Models\Plano;
use App\Models\PlanoRecurso;
use App\Models\Produto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class AdminProdutoController extends Controller
{
    public function index(): JsonResponse
    {
        $produtos = Produto::orderBy('ordem')->orderBy('id')->get();

        return response()->json($produtos);
    }

    public function store(CriarProdutoRequest $request): JsonResponse
    {
        $produto = Produto::create($request->validated());

        return response()->json($produto, 201);
    }

    public function update(AtualizarProdutoRequest $request, Produto $produto): JsonResponse
    {
        $produto->update($request->validated());

        return response()->json($produto->fresh());
    }

    public function assinantes(Produto $produto): JsonResponse
    {
        $usuarios = [];

        $addons = AssinanteAddon::where('addon_key', $produto->chave)
            ->with('user:id,name,email')
            ->orderByDesc('iniciado_em')
            ->get();

        foreach ($addons as $addon) {
            $usuarios[] = [
                'user_id'     => $addon->user_id,
                'email'       => $addon->user?->email,
                'nome'        => $addon->user?->name,
                'tipo_acesso' => 'addon',
                'fonte'       => $addon->fonte,
                'status'      => $addon->status,
                'iniciado_em' => $addon->iniciado_em?->toDateString(),
                'expira_em'   => $addon->expira_em?->toDateString(),
            ];
        }

        if ($produto->recurso_plano) {
            $planoIds = PlanoRecurso::where('chave', $produto->recurso_plano)
                ->where('valor', 'true')
                ->pluck('plano_id');

            $slugs = Plano::whereIn('id', $planoIds)->pluck('slug');

            $idsJaIncluidos = $addons->pluck('user_id')->all();

            Assinante::whereIn('plano', $slugs)
                ->where('ativo', true)
                ->whereNotIn('user_id', $idsJaIncluidos)
                ->with('user:id,name,email')
                ->get()
                ->each(function (Assinante $assinante) use (&$usuarios) {
                    $usuarios[] = [
                        'user_id'     => $assinante->user_id,
                        'email'       => $assinante->user?->email,
                        'nome'        => $assinante->user?->name,
                        'tipo_acesso' => 'plano',
                        'fonte'       => 'plano',
                        'status'      => 'ativo',
                        'plano'       => $assinante->plano,
                        'iniciado_em' => $assinante->assinado_em?->toDateString(),
                        'expira_em'   => null,
                    ];
                });
        }

        return response()->json([
            'total'    => count($usuarios),
            'usuarios' => $usuarios,
        ]);
    }

    public function destroy(Produto $produto): JsonResponse|Response
    {
        $temAtivos = AssinanteAddon::where('addon_key', $produto->chave)
            ->where('status', 'ativo')
            ->exists();

        if ($temAtivos) {
            return response()->json([
                'message' => "Não é possível excluir o produto \"{$produto->nome}\": existem assinantes com acesso ativo. Desative o produto em vez de excluí-lo.",
            ], 422);
        }

        $produto->delete();

        return response()->noContent();
    }
}
