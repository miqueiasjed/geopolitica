<?php

namespace App\Jobs;

use App\Services\FeedUpdaterService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessFeedUpdateJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(FeedUpdaterService $feedUpdaterService): void
    {
        $resultado = $feedUpdaterService->atualizar();

        Log::info('Atualização do feed processada.', $resultado);
    }
}
