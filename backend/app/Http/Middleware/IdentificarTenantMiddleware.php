<?php

namespace App\Http\Middleware;

use App\Models\Empresa;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentificarTenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $dominioBase = config('app.domain');

        // Remover o domínio base para obter o subdomínio
        $subdominio = str_replace('.' . $dominioBase, '', $host);

        // Domínio raiz ou www não tem tenant — rotas com este middleware requerem subdomínio B2B
        if ($subdominio === $dominioBase || $subdominio === 'www') {
            abort(404, 'Recurso disponível apenas em subdomínios B2B.');
        }

        $empresa = Empresa::where('subdominio', $subdominio)
            ->where('ativo', true)
            ->first();

        if (! $empresa || ! $empresa->estaAtiva()) {
            abort(404, 'Licença não encontrada ou expirada.');
        }

        // Injetar empresa no request para uso nos controllers
        $request->merge(['empresa_id' => $empresa->id]);
        app()->instance('tenant', $empresa);

        return $next($request);
    }
}
