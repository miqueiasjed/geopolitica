<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CalcularCarteiraRequest;
use App\Models\Carteira;
use App\Services\RiskScoreService;
use Illuminate\Http\JsonResponse;

class CarteiraRiscoController extends Controller
{
    public function __construct(private readonly RiskScoreService $riskScoreService)
    {
    }

    public function buscar(): JsonResponse
    {
        $this->verificarAcessoRiskScore();

        $carteira = Carteira::where('user_id', auth()->id())->first();

        return response()->json(['carteira' => $carteira]);
    }

    public function calcular(CalcularCarteiraRequest $request): JsonResponse
    {
        $this->verificarAcessoRiskScore();

        $ativos = $request->input('ativos');

        $carteira = $this->riskScoreService->salvarCarteira(auth()->id(), $ativos);

        return response()->json(['carteira' => $carteira, 'score' => $carteira->score]);
    }

    private function verificarAcessoRiskScore(): void
    {
        $plano = auth()->user()->assinante?->plano;

        if (! in_array($plano, ['pro', 'reservado', 'admin'], true)) {
            abort(403, 'Risk Score disponível apenas para planos Pro e Reservado.');
        }
    }
}
