<?php

namespace App\Providers;

use App\Models\Produto;
use App\Services\PlanoService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('acessar-vertical', function (\App\Models\User $user, string $addonKey): bool {
            if ($user->hasRole('admin')) {
                return true;
            }

            $slugPlano = $user->assinante?->plano ?? 'essencial';

            // Addon avulso tem prioridade
            if ($user->assinante?->temAddon($addonKey)) {
                return true;
            }

            // Verifica se o plano inclui este addon via recurso_plano configurado no produto
            $recursoPlano = Produto::where('chave', $addonKey)->value('recurso_plano');

            if (! $recursoPlano) {
                return false;
            }

            return app(PlanoService::class)->recursoBoolean($slugPlano, $recursoPlano);
        });
    }
}
