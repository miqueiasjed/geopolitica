<?php

namespace App\Jobs;

use App\Services\DetectorSinaisService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class DetectarSinaisJob implements ShouldQueue
{
    use Queueable;

    public int $tries   = 3;
    public int $timeout = 120;
    public int $backoff = 60;

    public function __construct()
    {
        $this->onQueue('alertas');
    }

    public function handle(DetectorSinaisService $servico): void
    {
        $inicio = now();
        Log::channel('pipeline')->info('[DetectarSinais] ===== INICIANDO DetectarSinaisJob =====', [
            'hora_inicio' => $inicio->toDateTimeString(),
        ]);

        $servico->detectar();

        Log::channel('pipeline')->info('[DetectarSinais] ===== CONCLUÍDO DetectarSinaisJob =====', [
            'duracao_segundos' => $inicio->diffInSeconds(now()),
            'hora_fim' => now()->toDateTimeString(),
        ]);
    }
}
