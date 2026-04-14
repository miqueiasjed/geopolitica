<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndicadorHistoricoRequest;
use App\Services\IndicadoresService;
use Illuminate\Http\JsonResponse;

class IndicadoresHistoricoController extends Controller
{
    public function __construct(
        private readonly IndicadoresService $indicadoresService
    ) {}

    public function index(IndicadorHistoricoRequest $request): JsonResponse
    {
        $dados = $this->indicadoresService->historicoPorSimbolo($request->simbolo);

        return response()->json([
            'simbolo'   => $request->simbolo,
            'historico' => $dados,
        ]);
    }
}
