<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CalcularCarteiraRequest;
use App\Models\Carteira;
use App\Services\PlanoService;
use App\Services\RiskScoreService;
use Illuminate\Http\JsonResponse;

class CarteiraRiscoController extends Controller
{
    public function __construct(
        private readonly RiskScoreService $riskScoreService,
        private readonly PlanoService $planoService,
    ) {
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
        $usuario = auth()->user();

        if ($usuario->hasRole('admin')) {
            return;
        }

        $slugPlano = $usuario->assinante?->plano ?? 'essencial';
        $temAcesso = $this->planoService->recursoBoolean($slugPlano, 'risk_score');

        if (! $temAcesso) {
            abort(403, 'Risk Score disponível apenas para planos Pro e Reservado.');
        }
    }
}
