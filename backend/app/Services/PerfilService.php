<?php

namespace App\Services;

use App\Models\User;

class PerfilService
{
    public function obter(User $usuario): array
    {
        $usuario->load('assinante');

        return $this->serializarUsuario($usuario);
    }

    public function atualizar(User $usuario, array $dados): array
    {
        if (array_key_exists('name', $dados)) {
            $usuario->name = $dados['name'];
        }

        if (array_key_exists('email', $dados)) {
            $usuario->email = $dados['email'];
        }

        if (! empty($dados['password'])) {
            $usuario->password = $dados['password'];
        }

        $usuario->save();
        $usuario->load('assinante');

        return $this->serializarUsuario($usuario);
    }

    private function serializarUsuario(User $usuario): array
    {
        return [
            'id' => $usuario->id,
            'name' => $usuario->name,
            'email' => $usuario->email,
            'role' => $usuario->getRoleNames()->first(),
            'assinante' => $usuario->assinante ? [
                'id' => $usuario->assinante->id,
                'plano' => $usuario->assinante->plano,
                'ativo' => $usuario->assinante->ativo,
                'status' => $usuario->assinante->status,
                'hotmart_subscriber_code' => $usuario->assinante->hotmart_subscriber_code,
                'assinado_em' => $usuario->assinante->assinado_em?->toIso8601String(),
                'expira_em' => $usuario->assinante->expira_em?->toIso8601String(),
            ] : null,
        ];
    }
}
