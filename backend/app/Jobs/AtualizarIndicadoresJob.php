<?php

namespace App\Jobs;

use App\Services\IndicadoresService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class AtualizarIndicadoresJob implements ShouldQueue
{
    use Queueable;

    public int $tries   = 3;
    public int $timeout = 60;
    public int $backoff = 30;

    public function handle(IndicadoresService $indicadoresService): void
    {
        Log::info('AtualizarIndicadoresJob: iniciando atualização de indicadores de mercado.');

        $indicadoresService->atualizarTodos();

        Log::info('AtualizarIndicadoresJob: atualização de indicadores concluída.');
    }
}
