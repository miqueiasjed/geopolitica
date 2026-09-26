<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bloqueia qualquer requisição (API, webhooks, cron HTTP, páginas web) quando
 * SITE_DESATIVADO=true. O código e o banco continuam no servidor; só o acesso
 * é cortado. Para reativar basta voltar a flag para false e limpar o cache de config.
 */
class BloquearSiteDesativado
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('app.site_desativado')) {
            return $next($request);
        }

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'message' => 'Este site foi desativado.',
                'site_desativado' => true,
            ], 503);
        }

        return response()->view('site-desativado', [], 503);
    }
}
