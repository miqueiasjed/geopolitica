<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlanoReal
{
    private const PLANOS_REAIS = ['essencial', 'pro', 'reservado'];

    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario?->hasRole('admin')) {
            return $next($request);
        }

        if (in_array($usuario?->assinante?->plano, self::PLANOS_REAIS, true)) {
            return $next($request);
        }

        return new JsonResponse([
            'message' => 'Disponível apenas nos planos Essencial, Pro e Reservado.',
            'code'    => 'plano_necessario',
        ], 403);
    }
}
