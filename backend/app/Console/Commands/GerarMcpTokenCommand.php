<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GerarMcpTokenCommand extends Command
{
    protected $signature = 'conteudo:mcp-token {email : E-mail do usuário admin}';

    protected $description = 'Gera um token Sanctum para o servidor MCP de conteúdos (usuário precisa ser admin)';

    public function handle(): int
    {
        $email = $this->argument('email');

        $usuario = User::where('email', $email)->first();

        if (! $usuario) {
            $this->error("Usuário com e-mail {$email} não encontrado.");
            return 1;
        }

        if (! $usuario->hasRole('admin')) {
            $this->error("O usuário {$email} não possui a role 'admin'. As rotas de conteúdo exigem admin.");
            return 1;
        }

        $token = $usuario->createToken('mcp-conteudo')->plainTextToken;

        $this->info("✅ Token gerado para {$usuario->email} (ID: {$usuario->id}).");
        $this->newLine();
        $this->line('Defina no ambiente do servidor MCP (ou no .env):');
        $this->newLine();
        $this->line("ADMIN_TOKEN={$token}");
        $this->newLine();
        $this->warn('Guarde este token com segurança: ele não será exibido novamente.');

        return 0;
    }
}
