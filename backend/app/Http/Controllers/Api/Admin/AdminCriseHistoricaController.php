<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarCriseHistoricaRequest;
use App\Http\Requests\CriarCriseHistoricaRequest;
use App\Models\CriseHistorica;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AdminCriseHistoricaController extends Controller
{
    public function index(): JsonResponse
    {
        $crises = CriseHistorica::orderByDesc('ano')
            ->orderByDesc('data_inicio')
            ->get();

        return response()->json(['data' => $crises]);
    }

    public function store(CriarCriseHistoricaRequest $request): JsonResponse
    {
        $crise = CriseHistorica::create($request->validated());

        $this->limparCache($crise->slug);

        return response()->json(['data' => $crise], 201);
    }

    public function update(AtualizarCriseHistoricaRequest $request, int $id): JsonResponse
    {
        $crise = CriseHistorica::findOrFail($id);

        $slugAntigo = $crise->slug;

        $crise->update($request->validated());

        $this->limparCache($slugAntigo);
        $this->limparCache($crise->fresh()->slug);

        return response()->json(['data' => $crise->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $crise = CriseHistorica::findOrFail($id);

        $this->limparCache($crise->slug);

        $crise->delete();

        return response()->json(null, 204);
    }

    private function limparCache(string $slug): void
    {
        Cache::forget("timeline_crise_{$slug}");
    }
}
