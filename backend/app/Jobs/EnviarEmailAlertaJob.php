<?php

namespace App\Jobs;

use App\Models\AlertaPreditivo;
use App\Services\EntregaAlertaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EnviarEmailAlertaJob implements ShouldQueue
{
    use Queueable;

    public int $tries   = 3;
    public int $timeout = 300;

    public function __construct(public int $alertaId)
    {
        $this->onQueue('emails');
    }

    public function handle(EntregaAlertaService $servico): void
    {
        $alerta = AlertaPreditivo::find($this->alertaId);

        if (! $alerta) {
            return;
        }

        $servico->enviarEmails($alerta);
    }
}
