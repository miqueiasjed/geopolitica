<?php

namespace App\Services;

use App\Mail\ConviteB2BMail;
use App\Models\Empresa;
use App\Models\MembroB2B;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class MembroB2BService
{
    public function convidar(Empresa $empresa, string $email, string $roleB2B = 'reader'): MembroB2B
    {
        $totalAtivos = $empresa->membros()->ativos()->count();

        if ($totalAtivos >= $empresa->max_usuarios) {
            throw new \RuntimeException("Limite de {$empresa->max_usuarios} usuários atingido.");
        }

        $jaEhMembro = $empresa->membros()
            ->ativos()
            ->where('convite_email', $email)
            ->exists();

        if ($jaEhMembro) {
            throw new \RuntimeException("O e-mail '{$email}' já é membro ativo desta empresa.");
        }

        $token = Str::uuid()->toString();

        $membro = MembroB2B::query()->create([
            'empresa_id'    => $empresa->id,
            'role_b2b'      => $roleB2B,
            'convite_token' => $token,
            'convite_email' => $email,
            'aceito_em'     => null,
        ]);

        Mail::to($email)->send(new ConviteB2BMail($empresa, $token, $roleB2B));

        return $membro;
    }

    public function aceitarConvite(string $token, array $dadosUsuario): User
    {
        $membro = MembroB2B::query()
            ->where('convite_token', $token)
            ->whereNull('aceito_em')
            ->firstOrFail();

        $usuario = User::query()->create([
            'name'     => $dadosUsuario['nome'],
            'email'    => $membro->convite_email,
            'password' => Hash::make($dadosUsuario['senha']),
        ]);

        $usuario->assignRole($membro->role_b2b);

        $membro->update([
            'user_id'       => $usuario->id,
            'aceito_em'     => now(),
            'convite_token' => null,
        ]);

        return $usuario;
    }

    public function removerMembro(MembroB2B $membro): void
    {
        $usuario = $membro->usuario;

        $membro->delete();

        if ($usuario) {
            $pertenceAOutraEmpresa = MembroB2B::query()
                ->where('user_id', $usuario->id)
                ->whereNotNull('aceito_em')
                ->exists();

            if (! $pertenceAOutraEmpresa) {
                $usuario->syncRoles([]);
            }
        }
    }
}
