<?php

namespace App\Console\Commands;

use App\Models\AlertaPreditivo;
use App\Models\SinalPadrao;
use Illuminate\Console\Command;

class BackfillAlertaEventoIdCommand extends Command
{
    protected $signature = 'alertas:backfill-evento-id';

    protected $description = 'Preenche evento_id nos alertas existentes com base nos sinais da região';

    public function handle(): int
    {
        $alertas = AlertaPreditivo::whereNull('evento_id')->get();

        if ($alertas->isEmpty()) {
            $this->info('Nenhum alerta sem evento_id encontrado.');
            return self::SUCCESS;
        }

        $this->info("Processando {$alertas->count()} alertas...");
        $atualizados = 0;

        foreach ($alertas as $alerta) {
            $eventoId = SinalPadrao::where('regiao', $alerta->regiao)
                ->whereNotNull('event_id')
                ->where('analisado_em', '<=', $alerta->created_at->addHours(72))
                ->orderByDesc('analisado_em')
                ->value('event_id');

            if ($eventoId) {
                $alerta->update(['evento_id' => $eventoId]);
                $atualizados++;
            }
        }

        $this->info("Concluído: {$atualizados} alertas atualizados.");
        return self::SUCCESS;
    }
}
