<?php

namespace App\Providers;

use App\Models\Conteudo;
use App\Models\User;
use App\Policies\ConteudoPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Conteudo::class => ConteudoPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // O reset de senha acontece no frontend (SPA), entao geramos o link
        // apontando para a pagina de redefinicao em vez da rota nomeada
        // password.reset, que nao existe neste backend de API.
        ResetPassword::createUrlUsing(function (User $usuario, string $token): string {
            $base = rtrim(config('app.frontend_url'), '/');

            return $base.'/redefinir-senha?'.http_build_query([
                'token' => $token,
                'email' => $usuario->getEmailForPasswordReset(),
            ]);
        });
    }
}
