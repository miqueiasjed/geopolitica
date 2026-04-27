<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('acessar-vertical', function (\App\Models\User $user, string $addonKey): bool {
            $assinante = $user->assinante;

            return $assinante?->temAcessoVertical($addonKey) ?? false;
        });
    }
}
