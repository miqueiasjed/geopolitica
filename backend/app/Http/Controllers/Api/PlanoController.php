<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plano;
use Illuminate\Http\JsonResponse;

class PlanoController extends Controller
{
    public function index(): JsonResponse
    {
        $planos = Plano::where('ativo', true)
            ->with('recursos')
            ->orderBy('ordem')
            ->get()
            ->map(fn (Plano $plano) => [
                'id'          => $plano->id,
                'slug'        => $plano->slug,
                'nome'        => $plano->nome,
                'descricao'   => $plano->descricao,
                'preco'       => $plano->preco,
                'exibir_no_upgrade' => $plano->exibir_no_upgrade,
                'lastlink_url' => $plano->lastlink_url,
                'recursos'    => $plano->recursos
                    ->mapWithKeys(fn ($r) => [$r->chave => $r->valor])
                    ->all(),
            ]);

        return response()->json(['data' => $planos]);
    }
}
