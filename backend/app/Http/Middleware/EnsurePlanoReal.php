<?php

namespace App\Http\Middleware;

use App\Services\PlanoService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlanoReal
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario?->hasRole('admin')) {
            return $next($request);
        }

        $slugPlano = $usuario?->assinante?->plano;

        if ($slugPlano && $this->planoService->planoExiste($slugPlano)) {
            return $next($request);
        }

        return new JsonResponse([
            'message' => 'Disponível apenas em planos com assinatura ativa.',
            'code'    => 'plano_necessario',
        ], 403);
    }
}
