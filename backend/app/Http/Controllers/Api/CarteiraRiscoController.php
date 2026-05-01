<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CalcularCarteiraRequest;
use App\Models\Carteira;
use App\Services\RiskScoreService;
use Illuminate\Http\JsonResponse;

class CarteiraRiscoController extends Controller
{
    public function __construct(
        private readonly RiskScoreService $riskScoreService,
    ) {
    }

    public function buscar(): JsonResponse
    {
        $carteira = Carteira::where('user_id', auth()->id())->first();

        return response()->json(['carteira' => $carteira]);
    }

    public function calcular(CalcularCarteiraRequest $request): JsonResponse
    {
        $carteira = $this->riskScoreService->salvarCarteira(auth()->id(), $request->input('ativos'));

        return response()->json(['carteira' => $carteira, 'score' => $carteira->score]);
    }
}
