<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AlertaPreditivoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertaController extends Controller
{
    public function __construct(
        private readonly AlertaPreditivoService $alertaPreditivoService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $usuario        = $request->user();
        $nivelPermitido = $this->alertaPreditivoService->nivelPermitido($usuario);
        $resultado      = $this->alertaPreditivoService->alertasNaoLidos($usuario->id, $nivelPermitido);

        return response()->json($resultado);
    }

    public function marcarLido(Request $request, int $id): JsonResponse
    {
        $alerta = $this->alertaPreditivoService->buscarPorId($id);

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
