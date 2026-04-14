<?php

namespace App\Jobs;

use App\Services\AnalisadorConvergenciaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

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
        $servico->analisar();
    }
}
