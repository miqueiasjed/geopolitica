<?php

namespace App\Providers;

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

            return (bool) $user->assinante?->temAddon($addonKey);
        });
    }
}
