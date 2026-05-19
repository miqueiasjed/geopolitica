<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AtualizarProdutoRequest;
use App\Http\Requests\Admin\CriarProdutoRequest;
use App\Models\AssinanteAddon;
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
