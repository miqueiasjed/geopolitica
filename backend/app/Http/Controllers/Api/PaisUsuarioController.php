<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\LimitePaisesAtingidoException;
use App\Http\Controllers\Controller;
use App\Http\Requests\AdicionarPaisRequest;
use App\Models\PaisUsuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaisUsuarioController extends Controller
{
    private const LIMITES = ['essencial' => 3, 'pro' => 10];

    private const PAPEIS_ILIMITADOS = ['reservado', 'admin'];

    public function index(Request $request): JsonResponse
    {
        $paisesSeguidos = PaisUsuario::where('user_id', $request->user()->id)
            ->with('perfil')
            ->get();

        return response()->json(['data' => $paisesSeguidos]);
    }

    public function store(AdicionarPaisRequest $request): JsonResponse
    {
        $usuario = $request->user();
        $plano   = $usuario->getRoleNames()->first() ?? 'essencial';

        if (! in_array($plano, self::PAPEIS_ILIMITADOS)) {
            $limite        = self::LIMITES[$plano] ?? self::LIMITES['essencial'];
            $totalSeguidos = PaisUsuario::where('user_id', $usuario->id)->count();

            if ($totalSeguidos >= $limite) {
                throw new LimitePaisesAtingidoException($limite, $plano);
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
