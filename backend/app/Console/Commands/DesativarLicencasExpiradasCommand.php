<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DesativarLicencasExpiradasCommand extends Command
{
    protected $signature = 'b2b:desativar-expiradas';

    protected $description = 'Desativa empresas B2B cujas licenças expiraram.';

    public function handle(): int
    {
        $empresas = Empresa::query()
            ->where('ativo', true)
            ->where('expira_em', '<', now())
            ->get();

        if ($empresas->isEmpty()) {
            $this->info('Nenhuma licença expirada encontrada.');

            return self::SUCCESS;
        }

        $total = $empresas->count();

        foreach ($empresas as $empresa) {
            $empresa->update(['ativo' => false]);
        }

        $this->info("Licenças desativadas: {$total}.");

        Log::info("[b2b:desativar-expiradas] {$total} empresa(s) desativada(s) por expiração.", [
            'empresa_ids' => $empresas->pluck('id')->toArray(),
        ]);

        return self::SUCCESS;
    }
}
