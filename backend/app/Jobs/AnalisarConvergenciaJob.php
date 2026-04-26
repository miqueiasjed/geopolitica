<?php

namespace App\Jobs;

use App\Services\AnalisadorConvergenciaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class AnalisarConvergenciaJob implements ShouldQueue
{
    use Queueable;

    public int $tries   = 3;
    public int $timeout = 180;
    public int $backoff = 60;

    public function __construct()
    {
        $this->onQueue('alertas');
    }

    public function handle(AnalisadorConvergenciaService $servico): void
    {
        $inicio = now();
        Log::channel('pipeline')->info('[AnalisarConvergencia] ===== INICIANDO AnalisarConvergenciaJob =====', [
            'hora_inicio' => $inicio->toDateTimeString(),
        ]);

        $servico->analisar();

        Log::channel('pipeline')->info('[AnalisarConvergencia] ===== CONCLUÍDO AnalisarConvergenciaJob =====', [
            'duracao_segundos' => $inicio->diffInSeconds(now()),
            'hora_fim' => now()->toDateTimeString(),
        ]);
    }
}
