<?php

namespace App\Policies;

use App\Models\Conteudo;
use App\Models\User;
use App\Services\PlanoService;

class ConteudoPolicy
{
    private const HIERARQUIA_NIVEL  = ['essencial' => 1, 'pro' => 2, 'todos' => 3];
    private const HIERARQUIA_MINIMO = ['essencial' => 1, 'pro' => 2, 'reservado' => 3];

    public function __construct(private readonly PlanoService $planoService) {}

    private function nivelUsuario(User $usuario): int
    {
        if ($usuario->hasRole('admin')) {
            return 99;
        }

        $slugPlano   = $usuario->assinante?->plano ?? 'gratuito';
        $nivelMaximo = $this->planoService->valorRecurso($slugPlano, 'conteudo_nivel_maximo') ?? $slugPlano;

        return self::HIERARQUIA_NIVEL[$nivelMaximo] ?? 0;
    }

    public function verPublico(User $usuario, Conteudo $conteudo): bool
    {
        $nivelExigido = self::HIERARQUIA_MINIMO[$conteudo->plano_minimo] ?? 99;

        return $this->nivelUsuario($usuario) >= $nivelExigido;
    }

    public function gerenciarAdmin(User $usuario): bool
    {
        return $usuario->hasRole('admin');
    }
}
