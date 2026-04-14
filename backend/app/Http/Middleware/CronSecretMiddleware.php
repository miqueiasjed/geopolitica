<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CronSecretMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $segredo = $request->header('X-Cron-Secret')
            ?? $request->query('cron_secret', '');

        $segredoEsperado = config('app.cron_secret', '');

        if (! hash_equals($segredoEsperado, (string) $segredo)) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        return $next($request);
    }
}
