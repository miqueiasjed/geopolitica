<?php

namespace App\Jobs;

use App\Services\DetectorSinaisService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

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
        $servico->detectar();
    }
}
