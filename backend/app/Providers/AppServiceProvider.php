<?php

namespace App\Providers;

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

            $chave = match ($addonKey) {
                'elections' => 'monitor_eleitoral',
                'war'       => 'monitor_guerra',
                default     => null,
            };

            if ($chave === null) {
                return false;
            }

            return app(PlanoService::class)->recursoBoolean($slugPlano, $chave);
        });
    }
}
