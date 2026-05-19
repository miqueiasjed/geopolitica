<?php

namespace App\Console\Commands;

use App\Models\Assinante;
use Illuminate\Console\Command;

class CorrigirPlanoAddonOnly extends Command
{
    protected $signature = 'assinantes:corrigir-plano-addon-only
                            {--dry-run : Apenas mostra o que seria alterado, sem salvar}';

    protected $description = 'Corrige assinantes com plano "essencial" que são na verdade addon-only (sem role de plano)';

    private const ROLES_PLANO = ['assinante_essencial', 'assinante_pro', 'assinante_reservado'];

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('MODO DRY-RUN — nenhuma alteração será salva.');
        }

        $candidatos = Assinante::where('plano', 'essencial')
            ->with('user')
            ->get();

        $this->info("Encontrados {$candidatos->count()} assinante(s) com plano 'essencial'. Verificando roles...");

        $alterados = 0;
        $ignorados  = 0;

        foreach ($candidatos as $assinante) {
            $usuario = $assinante->user;

            if (! $usuario) {
                continue;
            }

            // Tem role de plano real → comprou um plano de fato, não tocar
            if ($usuario->hasAnyRole(self::ROLES_PLANO)) {
                $ignorados++;
                $this->line("  <fg=gray>IGNORADO</> {$usuario->email} — tem role de plano real");
                continue;
            }

            $addons = array_values(array_filter($assinante->addons ?? []));

            if (empty($addons)) {
                $ignorados++;
                $this->line("  <fg=gray>IGNORADO</> {$usuario->email} — sem role de plano e sem addons");
                continue;
            }

            // Usa o primeiro addon como identificador do plano
            $novoPlano = $addons[0];

            $sufixo = count($addons) > 1 ? ' (todos: ' . implode(', ', $addons) . ')' : '';
            $this->line("  <fg=green>ALTERAR</> {$usuario->email}: essencial → {$novoPlano}{$sufixo}");

            if (! $dryRun) {
                $assinante->update(['plano' => $novoPlano]);
            }

            $alterados++;
        }

        $this->newLine();

        if ($dryRun) {
            $this->warn("DRY-RUN: {$alterados} seriam alterados, {$ignorados} ignorados.");
        } else {
            $this->info("{$alterados} assinante(s) corrigido(s), {$ignorados} ignorado(s).");
        }

        return self::SUCCESS;
    }
}
