<?php

namespace App\Providers;

use App\Services\ConfiguracaoService;
use Illuminate\Support\ServiceProvider;

class ConfiguracaoServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Não carrega durante comandos de migração/seed para evitar erros de tabela inexistente
        if ($this->app->runningInConsole() && $this->isRunningMigration()) {
            return;
        }

        try {
            app(ConfiguracaoService::class)->carregarNoConfig();
        } catch (\Exception) {
            // Tabela pode não existir em ambiente fresh; env() continua como fallback
        }
    }

    private function isRunningMigration(): bool
    {
        $argv = $_SERVER['argv'] ?? [];
        $migrationCommands = ['migrate', 'migrate:fresh', 'migrate:rollback', 'migrate:reset', 'db:seed'];

        foreach ($argv as $arg) {
            foreach ($migrationCommands as $cmd) {
                if (str_contains((string) $arg, $cmd)) {
                    return true;
                }
            }
        }

        return false;
    }
}
