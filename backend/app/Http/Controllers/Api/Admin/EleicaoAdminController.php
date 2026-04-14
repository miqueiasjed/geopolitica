<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarEleicaoRequest;
use App\Http\Requests\CriarEleicaoRequest;
use App\Models\Eleicao;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class EleicaoAdminController extends Controller
{
    public function store(CriarEleicaoRequest $request): JsonResponse
    {
        $eleicao = Eleicao::create($request->validated());

        $this->invalidarCacheListagem($eleicao->data_eleicao->year);

        return response()->json(['data' => $eleicao], 201);
    }

    public function update(AtualizarEleicaoRequest $request, int $id): JsonResponse
    {
        $eleicao = Eleicao::findOrFail($id);

        $eleicao->update($request->validated());

        Cache::forget("eleicao_{$id}");
        $this->invalidarCacheListagem($eleicao->data_eleicao->year);

        return response()->json(['data' => $eleicao->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $eleicao = Eleicao::findOrFail($id);

        $ano = $eleicao->data_eleicao->year;

        Cache::forget("eleicao_{$id}");
        $eleicao->delete();

        $this->invalidarCacheListagem($ano);

        return response()->json(null, 204);
    }

    private function invalidarCacheListagem(int $ano): void
    {
        foreach (['todas', 'alta', 'media', 'baixa'] as $relevancia) {
            Cache::forget("eleicoes_{$ano}_{$relevancia}");
        }
    }
}
