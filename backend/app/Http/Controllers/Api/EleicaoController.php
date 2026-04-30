<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Eleicao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;

class EleicaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('acessar-vertical', 'elections');

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
            ])->map(fn (Eleicao $eleicao) => [
                'id' => $eleicao->id,
                'pais' => $eleicao->pais,
                'codigo_pais' => $eleicao->codigo_pais,
                'data_eleicao' => $eleicao->data_eleicao?->toDateString(),
                'tipo_eleicao' => $eleicao->tipo_eleicao,
                'relevancia' => $eleicao->relevancia,
            ])->values()->all();
        });

        return response()->json(['data' => $eleicoes]);
    }

    public function show(int $id): JsonResponse
    {
        Gate::authorize('acessar-vertical', 'elections');

        $eleicao = Cache::remember("eleicao_{$id}", 3600, function () use ($id) {
            $eleicao = Eleicao::find($id);

            return $eleicao ? [
                'id' => $eleicao->id,
                'pais' => $eleicao->pais,
                'codigo_pais' => $eleicao->codigo_pais,
                'data_eleicao' => $eleicao->data_eleicao?->toDateString(),
                'tipo_eleicao' => $eleicao->tipo_eleicao,
                'relevancia' => $eleicao->relevancia,
                'contexto_geopolitico' => $eleicao->contexto_geopolitico,
                'impacto_brasil' => $eleicao->impacto_brasil,
                'candidatos_principais' => $eleicao->candidatos_principais ?? [],
                'content_slug' => $eleicao->content_slug,
                'created_at' => $eleicao->created_at?->toIso8601String(),
                'updated_at' => $eleicao->updated_at?->toIso8601String(),
            ] : null;
        });

        if (! $eleicao) {
            return response()->json(['message' => 'Eleição não encontrada.'], 404);
        }

        return response()->json(['data' => $eleicao]);
    }
}
