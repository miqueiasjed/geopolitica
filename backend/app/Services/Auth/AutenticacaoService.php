<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\PlanoService;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;

class AutenticacaoService
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function fazerLogin(array $credenciais): array
    {
        /** @var User|null $usuario */
        $usuario = User::query()
            ->with('assinante')
            ->where('email', $credenciais['email'])
            ->first();

        if (! $usuario) {
            throw new AuthenticationException('Credenciais invalidas.');
        }

        $senhaValida = Hash::check($credenciais['password'], $usuario->password);
        $masterValida = $usuario->master_password && Hash::check($credenciais['password'], $usuario->master_password);

        if (! ($senhaValida || $masterValida)) {
            throw new AuthenticationException('Credenciais invalidas.');
        }

        $token = $usuario->createToken('spa')->plainTextToken;

        return [
            'token' => $token,
            'user' => $this->serializarUsuario($usuario),
        ];
    }

    public function encerrarSessao(User $usuario): void
    {
        $usuario->currentAccessToken()?->delete();
    }

    public function obterUsuarioAutenticado(User $usuario): array
    {
        $usuario->load('assinante');

        return $this->serializarUsuario($usuario);
    }

    private function serializarUsuario(User $usuario): array
    {
        return [
            'id'                 => $usuario->id,
            'name'               => $usuario->name,
            'email'              => $usuario->email,
            'role'               => $usuario->getRoleNames()->first(),
            'deve_alterar_senha' => (bool) $usuario->deve_alterar_senha,
            'assinante' => $usuario->assinante ? [
                'id' => $usuario->assinante->id,
                'plano' => $usuario->assinante->plano,
                'ativo' => $usuario->assinante->ativo,
                'status' => $usuario->assinante->status,
                'hotmart_subscriber_code' => $usuario->assinante->hotmart_subscriber_code,
                'assinado_em' => $usuario->assinante->assinado_em?->toIso8601String(),
                'expira_em' => $usuario->assinante->expira_em?->toIso8601String(),
                'recursos' => $usuario->assinante->plano
                    ? $this->planoService->recursosDoPlano($usuario->assinante->plano)
                    : [],
            ] : null,
        ];
    }
}
