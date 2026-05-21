<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SetMasterPasswordCommand extends Command
{
    protected $signature = 'master-password:set {user_id : ID do usuário}';

    protected $description = 'Define uma senha master para acesso administrativo de debug';

    public function handle(): int
    {
        $userId = $this->argument('user_id');

        $usuario = User::find($userId);

        if (! $usuario) {
            $this->error("Usuário com ID {$userId} não encontrado.");
            return 1;
        }

        $senha = $this->secret('Digite a senha master');
        $confirma = $this->secret('Confirme a senha master');

        if ($senha !== $confirma) {
            $this->error('As senhas não conferem.');
            return 1;
        }

        if (strlen($senha) < 8) {
            $this->error('A senha master deve ter no mínimo 8 caracteres.');
            return 1;
        }

        $usuario->update(['master_password' => Hash::make($senha)]);

        $this->info("✅ Senha master definida para {$usuario->email} (ID: {$usuario->id})");

        return 0;
    }
}
