<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarPerfilPaisRequest;
use App\Http\Requests\CriarPerfilPaisRequest;
use App\Models\PerfilPais;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class AdminPerfilPaisController extends Controller
{
    public function index(): JsonResponse
    {
        $paises = PerfilPais::orderBy('nome_pt')->get();

        return response()->json(['data' => $paises]);
    }

    public function store(CriarPerfilPaisRequest $request): JsonResponse
    {
        $pais = PerfilPais::create($request->validated());

        return response()->json(['data' => $pais], 201);
    }

    public function update(AtualizarPerfilPaisRequest $request, string $codigo): JsonResponse
    {
        $pais = PerfilPais::findOrFail($codigo);

        $pais->update($request->validated());

        Cache::forget("perfil_pais_{$codigo}");
        Cache::forget("perfil_pais_v2_{$codigo}");

        return response()->json(['data' => $pais->fresh()]);
    }

    public function destroy(string $codigo): JsonResponse
    {
        $pais = PerfilPais::findOrFail($codigo);

        Cache::forget("perfil_pais_{$codigo}");
        Cache::forget("perfil_pais_v2_{$codigo}");

        $pais->delete();

        return response()->json(null, 204);
    }
}
