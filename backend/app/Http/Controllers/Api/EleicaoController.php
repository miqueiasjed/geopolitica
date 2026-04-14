<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Eleicao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EleicaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ano = (int) $request->query('ano', now()->year);
        $relevancia = $request->query('relevancia');

        $chaveCache = 'eleicoes_' . $ano . '_' . ($relevancia ?? 'todas');

        $eleicoes = Cache::remember($chaveCache, 3600, function () use ($ano, $relevancia) {
            $consulta = Eleicao::query()
                ->porAno($ano)
                ->ordenadaPorData();

            if ($relevancia) {
                $consulta->porRelevancia($relevancia);
            }

            return $consulta->get([
                'id',
                'pais',
                'codigo_pais',
                'data_eleicao',
                'tipo_eleicao',
                'relevancia',
            ]);
        });

        return response()->json(['data' => $eleicoes]);
    }

    public function show(int $id): JsonResponse
    {
        $eleicao = Cache::remember("eleicao_{$id}", 3600, function () use ($id) {
            return Eleicao::find($id);
        });

        if (! $eleicao) {
            return response()->json(['message' => 'Eleição não encontrada.'], 404);
        }

        return response()->json(['data' => $eleicao]);
    }
}
