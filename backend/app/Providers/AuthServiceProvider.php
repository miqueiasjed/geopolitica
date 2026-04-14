<?php

namespace App\Providers;

use App\Models\Conteudo;
use App\Policies\ConteudoPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Conteudo::class => ConteudoPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
