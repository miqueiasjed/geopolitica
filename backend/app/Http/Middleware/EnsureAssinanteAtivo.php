<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAssinanteAtivo
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario?->hasRole('admin')) {
            return $next($request);
        }

        if (! $usuario?->assinante?->ativo) {
            return new JsonResponse([
                'message' => 'Assinatura inativa.',
            ], 403);
        }

        return $next($request);
    }
}
