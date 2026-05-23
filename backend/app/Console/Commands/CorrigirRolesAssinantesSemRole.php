<?php

namespace App\Console\Commands;

use App\Models\Assinante;
use Illuminate\Console\Command;

class CorrigirRolesAssinantesSemRole extends Command
{
    protected $signature = 'assinantes:corrigir-roles-sem-role
                            {--dry-run : Apenas mostra o que seria alterado, sem salvar}';

    protected $description = 'Atribui a role correta a assinantes que foram criados sem nenhuma role (ex: via importação)';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('MODO DRY-RUN — nenhuma alteração será salva.');
        }

        $corrigidos = 0;
        $ignorados  = 0;

        Assinante::with('user')
            ->whereNotNull('plano')
            ->orderBy('id')
            ->chunk(200, function ($assinantes) use ($dryRun, &$corrigidos, &$ignorados) {
                foreach ($assinantes as $assinante) {
                    $user = $assinante->user;

                    if (! $user) {
                        continue;
                    }

                    if ($user->hasRole('assinante')) {
                        $ignorados++;
                        continue;
                    }

                    $plano = $assinante->plano;

                    $this->line("  [{$user->email}] plano={$plano} → role=assinante");

                    if (! $dryRun) {
                        $user->syncRoles(['assinante']);
                    }

                    $corrigidos++;
                }
            });

        $this->newLine();
        $this->info("Corrigidos: {$corrigidos} | Já tinham role (ignorados): {$ignorados}");

        if ($dryRun) {
            $this->warn('Rode sem --dry-run para aplicar as alterações.');
        }

        return self::SUCCESS;
    }
}
