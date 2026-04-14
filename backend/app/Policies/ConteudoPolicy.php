<?php

namespace App\Policies;

use App\Models\Conteudo;
use App\Models\User;

class ConteudoPolicy
{
    private const HIERARQUIA = [
        'essencial'  => 1,
        'pro'        => 2,
        'reservado'  => 3,
    ];

    private function nivelRole(User $usuario): int
    {
        if ($usuario->hasRole('admin') || $usuario->hasRole('assinante_reservado')) {
            return 3;
        }

        if ($usuario->hasRole('assinante_pro')) {
            return 2;
        }

        if ($usuario->hasRole('assinante_essencial')) {
            return 1;
        }

        return 0;
    }

    public function verPublico(User $usuario, Conteudo $conteudo): bool
    {
        $nivelUsuario = $this->nivelRole($usuario);
        $nivelExigido = self::HIERARQUIA[$conteudo->plano_minimo] ?? 99;

        return $nivelUsuario >= $nivelExigido;
    }

    public function gerenciarAdmin(User $usuario): bool
    {
        return $usuario->hasRole('admin');
    }
}
