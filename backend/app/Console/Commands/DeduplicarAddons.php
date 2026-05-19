<?php

namespace App\Console\Commands;

use App\Models\Assinante;
use App\Models\AssinanteAddon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeduplicarAddons extends Command
{
    protected $signature = 'assinantes:deduplicar-addons
                            {--dry-run : Apenas mostra o que seria removido, sem salvar}';

    protected $description = 'Remove linhas duplicadas de addons ativos em assinante_addons e deduplica o array JSON em assinantes';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('MODO DRY-RUN — nenhuma alteração será salva.');
        }

        $this->info('=== 1. Deduplicando assinante_addons (linhas ativas duplicadas) ===');
        $this->deduplicarTabela($dryRun);

        $this->newLine();
        $this->info('=== 2. Deduplicando array addons[] em assinantes ===');
        $this->deduplicarJsonArray($dryRun);

        return self::SUCCESS;
    }

    private function deduplicarTabela(bool $dryRun): void
    {
        // Agrupa por (user_id, addon_key, status) e encontra grupos com mais de 1 linha
        $duplicatas = DB::table('assinante_addons')
            ->select('user_id', 'addon_key', 'status', DB::raw('COUNT(*) as total'), DB::raw('MIN(id) as manter_id'))
            ->groupBy('user_id', 'addon_key', 'status')
            ->having('total', '>', 1)
            ->get();

        if ($duplicatas->isEmpty()) {
            $this->line('  Nenhuma linha duplicada encontrada.');
            return;
        }

        $removidos = 0;

        foreach ($duplicatas as $grupo) {
            $ids = DB::table('assinante_addons')
                ->where('user_id', $grupo->user_id)
                ->where('addon_key', $grupo->addon_key)
                ->where('status', $grupo->status)
                ->where('id', '!=', $grupo->manter_id)
                ->pluck('id');

            $this->line(sprintf(
                '  user_id=%d addon=%s status=%s — mantém id=%d, remove %d linha(s): [%s]',
                $grupo->user_id,
                $grupo->addon_key,
                $grupo->status,
                $grupo->manter_id,
                $ids->count(),
                $ids->implode(', '),
            ));

            if (! $dryRun) {
                DB::table('assinante_addons')->whereIn('id', $ids)->delete();
            }

            $removidos += $ids->count();
        }

        $this->newLine();

        if ($dryRun) {
            $this->warn("DRY-RUN: {$removidos} linha(s) seriam removidas.");
        } else {
            $this->info("{$removidos} linha(s) duplicada(s) removida(s).");
        }
    }

    private function deduplicarJsonArray(bool $dryRun): void
    {
        $assinantes = Assinante::whereNotNull('addons')->get();
        $corrigidos = 0;

        foreach ($assinantes as $assinante) {
            $original   = $assinante->addons ?? [];
            $dedup      = array_values(array_unique(array_filter($original)));

            if ($dedup === $original) {
                continue;
            }

            $this->line(sprintf(
                '  user_id=%d: %s → %s',
                $assinante->user_id,
                json_encode($original),
                json_encode($dedup),
            ));

            if (! $dryRun) {
                $assinante->forceFill(['addons' => $dedup])->save();
            }

            $corrigidos++;
        }

        if ($corrigidos === 0) {
            $this->line('  Nenhum array addons[] duplicado encontrado.');
            return;
        }

        $this->newLine();

        if ($dryRun) {
            $this->warn("DRY-RUN: {$corrigidos} assinante(s) teriam o array corrigido.");
        } else {
            $this->info("{$corrigidos} assinante(s) com array addons[] corrigido.");
        }
    }
}
