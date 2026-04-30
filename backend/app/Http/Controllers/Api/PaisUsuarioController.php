<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\LimitePaisesAtingidoException;
use App\Http\Controllers\Controller;
use App\Http\Requests\AdicionarPaisRequest;
use App\Models\PaisUsuario;
use App\Services\PlanoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaisUsuarioController extends Controller
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paisesSeguidos = PaisUsuario::where('user_id', $request->user()->id)
            ->with('perfil')
            ->get();

        return response()->json(['data' => $paisesSeguidos]);
    }

    public function store(AdicionarPaisRequest $request): JsonResponse
    {
        $usuario   = $request->user();
        $slugPlano = $usuario->assinante?->plano ?? 'essencial';

        if (! $usuario->hasRole('admin')) {
            $limite = $this->planoService->limiteInteiro($slugPlano, 'paises_seguidos_limite');

            if ($limite !== null) {
                $totalSeguidos = PaisUsuario::where('user_id', $usuario->id)->count();

                if ($totalSeguidos >= $limite) {
                    throw new LimitePaisesAtingidoException($limite, $slugPlano);
                }
            }
        }

        $paisUsuario = PaisUsuario::create([
            'user_id'      => $usuario->id,
            'codigo_pais'  => $request->validated('codigo_pais'),
            'adicionado_em' => now(),
        ]);

        $paisUsuario->load('perfil');

        return response()->json(['data' => $paisUsuario], 201);
    }

    public function destroy(Request $request, string $codigo): JsonResponse
    {
        $paisUsuario = PaisUsuario::where('user_id', $request->user()->id)
            ->where('codigo_pais', $codigo)
            ->first();

        if (! $paisUsuario) {
            return response()->json(['message' => 'Sem permissão para remover este país.'], 403);
        }

        $paisUsuario->delete();

        return response()->json(null, 204);
    }
}
