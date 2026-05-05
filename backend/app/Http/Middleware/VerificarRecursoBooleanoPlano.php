<?php

namespace App\Http\Middleware;

use App\Services\PlanoService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarRecursoBooleanoPlano
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function handle(Request $request, Closure $next, string $recurso): Response
    {
        $usuario = $request->user();

        if (! $usuario->hasRole('admin')) {
            $slugPlano = $usuario->assinante?->plano ?? 'essencial';
            $temAcesso = $this->planoService->recursoBoolean($slugPlano, $recurso);

            if (! $temAcesso) {
                abort(403, 'Seu plano não inclui acesso a este recurso.');
            }
        }

        return $next($request);
    }
}
