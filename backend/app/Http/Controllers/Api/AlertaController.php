<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlertaPreditivo;
use App\Services\AlertaPreditivoService;
use App\Services\PlanoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertaController extends Controller
{
    public function __construct(
        private readonly AlertaPreditivoService $alertaPreditivoService,
        private readonly PlanoService $planoService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $usuario  = $request->user();
        $slugPlano = $usuario->assinante?->plano ?? 'essencial';

        $nivelPermitido = $usuario->hasRole('admin')
            ? 'all'
            : ($this->planoService->valorRecurso($slugPlano, 'alertas_nivel') ?? 'medium');

        $resultado = $this->alertaPreditivoService->alertasNaoLidos($usuario->id, $nivelPermitido);

        return response()->json($resultado);
    }

    public function marcarLido(Request $request, int $id): JsonResponse
    {
        $alerta = AlertaPreditivo::find($id);

        if (! $alerta) {
            return response()->json(['message' => 'Alerta não encontrado.'], 404);
        }

        $resultado = $this->alertaPreditivoService->marcarLido($id, $request->user()->id);

        if ($resultado['sucesso'] === false) {
            return response()->json(['message' => $resultado['mensagem']], 409);
        }

        return response()->json(['message' => 'Alerta marcado como lido.']);
    }
}
