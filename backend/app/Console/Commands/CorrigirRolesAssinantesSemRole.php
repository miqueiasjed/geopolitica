<?php

namespace App\Console\Commands;

use App\Models\Assinante;
use App\Models\Plano;
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

        $mapaRoles = Plano::whereNotNull('role')
            ->pluck('role', 'slug')
            ->all();

        $corrigidos = 0;
        $ignorados  = 0;

        Assinante::with('user')
            ->whereNotNull('plano')
            ->orderBy('id')
            ->chunk(200, function ($assinantes) use ($dryRun, $mapaRoles, &$corrigidos, &$ignorados) {
                foreach ($assinantes as $assinante) {
                    $user = $assinante->user;

                    if (! $user) {
                        continue;
                    }

                    if ($user->roles()->count() > 0) {
                        $ignorados++;
                        continue;
                    }

                    $plano    = $assinante->plano;
                    $rolePlano = $mapaRoles[$plano] ?? ('assinante_' . $plano);

                    $this->line("  [{$user->email}] plano={$plano} → role={$rolePlano}");

                    if (! $dryRun) {
                        $user->assignRole($rolePlano);
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
