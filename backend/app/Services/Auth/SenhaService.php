<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class SenhaService
{
    public function enviarLinkRedefinicao(string $email): array
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return [
            'message' => __($status),
        ];
    }

    public function redefinirSenha(array $dados): array
    {
        $status = Password::reset(
            $dados,
            function (User $usuario, string $senha): void {
                $usuario->forceFill([
                    'password' => Hash::make($senha),
                    'remember_token' => \Illuminate\Support\Str::random(60),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return [
            'message' => __($status),
        ];
    }
}
