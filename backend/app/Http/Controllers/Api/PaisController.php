<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerfilPais;
use App\Services\EventosPaisService;
use App\Services\PaisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaisController extends Controller
{
    public function __construct(
        private readonly PaisService $paisService,
        private readonly EventosPaisService $eventosPaisService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paises = $this->paisService->listar($request->query('q'));

        return response()->json(['data' => $paises]);
    }

    public function show(string $codigo): JsonResponse
    {
        $perfil = $this->paisService->buscar(strtoupper($codigo));

        if (! $perfil) {
            return response()->json(['message' => 'País não encontrado.'], 404);
        }

        return response()->json(['data' => $perfil]);
    }

    public function eventos(string $codigo): JsonResponse
    {
        $perfil = PerfilPais::where('codigo_pais', $codigo)->first();

        if (! $perfil) {
            return response()->json(['message' => 'País não encontrado.'], 404);
        }

        $eventos = $this->eventosPaisService->buscarEventosRecentes($perfil);

        $dadosEventos = $eventos->map(fn ($evento) => [
            'id'           => $evento->id,
            'titulo'       => $evento->titulo,
            'descricao'    => $evento->resumo ?? null,
            'impact_label' => $evento->impact_label ?? 'MONITORAR',
            'created_at'   => $evento->created_at,
        ]);

        return response()->json(['data' => $dadosEventos]);
    }
}
