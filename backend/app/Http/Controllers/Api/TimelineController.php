<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimelineController extends Controller
{
    public function __construct(
        private readonly TimelineService $timelineService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $crises = $this->timelineService->listarCrises(
            periodoInicio: $request->periodo_inicio ? (int) $request->periodo_inicio : null,
            periodoFim: $request->periodo_fim ? (int) $request->periodo_fim : null,
            categoria: $request->categoria,
        );

        $eventos = $this->timelineService->listarEventos(
            periodoInicio: $request->periodo_inicio ? (int) $request->periodo_inicio : null,
            periodoFim: $request->periodo_fim ? (int) $request->periodo_fim : null,
        );

        return response()->json([
            'crises'  => $crises,
            'eventos' => $eventos,
        ]);
    }
}
