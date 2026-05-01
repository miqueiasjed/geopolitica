<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcarAlteracaoSenha
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario && $usuario->deve_alterar_senha && ! $request->is('auth/*')) {
            return response()->json([
                'message' => 'Você precisa alterar sua senha antes de continuar.',
                'codigo'  => 'deve_alterar_senha',
            ], 403);
        }

        return $next($request);
    }
}
