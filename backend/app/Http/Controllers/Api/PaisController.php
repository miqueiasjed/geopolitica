<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GerarPerfilPaisJob;
use App\Models\PerfilPais;
use App\Services\EventosPaisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PaisController extends Controller
{
    public function __construct(
        private readonly EventosPaisService $eventosPaisService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = $request->query('q');

        $chaveCache = 'paises_lista_' . md5($q ?? '');

        $paises = Cache::remember($chaveCache, 1800, function () use ($q) {
            return PerfilPais::query()
                ->when($q, fn ($query) => $query->where('nome_pt', 'ILIKE', "%{$q}%"))
                ->orderBy('nome_pt')
                ->get(['codigo_pais', 'nome_pt', 'bandeira_emoji', 'regiao_geopolitica', 'gerado_em']);
        });

        return response()->json(['data' => $paises]);
    }

    public function show(string $codigo): JsonResponse
    {
        $chaveCache = "perfil_pais_{$codigo}";

        $perfil = Cache::remember($chaveCache, 1800, function () use ($codigo) {
            return PerfilPais::where('codigo_pais', $codigo)->first();
        });

        if (! $perfil) {
            return response()->json(['message' => 'País não encontrado.'], 404);
        }

        if (is_null($perfil->gerado_em)) {
            GerarPerfilPaisJob::dispatch($perfil);
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
            'nivel_tensao' => $evento->nivel_tensao ?? null,
            'created_at'   => $evento->created_at,
        ]);

        return response()->json(['data' => $dadosEventos]);
    }
}
