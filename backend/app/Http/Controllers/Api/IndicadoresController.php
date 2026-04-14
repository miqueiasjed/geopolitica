<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IndicadoresService;
use Illuminate\Http\JsonResponse;

class IndicadoresController extends Controller
{
    public function __construct(
        private readonly IndicadoresService $indicadoresService
    ) {}

    public function index(): JsonResponse
    {
        $indicadores = $this->indicadoresService->listarComCache();

        return response()->json(['data' => $indicadores]);
    }
}
