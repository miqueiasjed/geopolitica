<?php

namespace App\Http\Middleware;

use App\Services\PlanoService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarAcessoRiskScore
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if (! $usuario->hasRole('admin')) {
            $slugPlano = $usuario->assinante?->plano ?? 'essencial';
            $temAcesso = $this->planoService->recursoBoolean($slugPlano, 'risk_score');

            if (! $temAcesso) {
                abort(403, 'Risk Score disponível apenas para planos Pro e Reservado.');
            }
        }

        return $next($request);
    }
}
