<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlertaPreditivo;
use App\Services\AlertaPreditivoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertaController extends Controller
{
    public function __construct(
        private readonly AlertaPreditivoService $alertaPreditivoService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $papel  = $request->user()->getRoleNames()->first() ?? 'assinante_essencial';

        $resultado = $this->alertaPreditivoService->alertasNaoLidos($userId, $papel);

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
