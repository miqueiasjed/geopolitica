<?php

use App\Jobs\AnalisarConvergenciaJob;
use App\Jobs\AtualizarGdeltJob;
use App\Jobs\AtualizarIndicadoresJob;
use App\Jobs\DetectarSinaisJob;
use App\Jobs\ProcessFeedUpdateJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// M01 – atualização de feeds: roda no minuto :00
Schedule::job(new ProcessFeedUpdateJob)
    ->hourly()
    ->withoutOverlapping();

// M09 – detecção de sinais: roda no minuto :00 (após feed)
Schedule::job(new DetectarSinaisJob)
    ->hourly()
    ->withoutOverlapping();

// M10 – análise de convergência: roda no minuto :05 (após detecção de sinais)
Schedule::job(new AnalisarConvergenciaJob)
    ->hourlyAt(5)
    ->withoutOverlapping();

// GDELT – dados de intensidade por país: roda no minuto :30 (sem conflito com M01)
Schedule::job(new AtualizarGdeltJob)
    ->hourlyAt(30)
    ->withoutOverlapping();

// M04 – Indicadores de Risco: atualiza cotações a cada 15 minutos
Schedule::job(new AtualizarIndicadoresJob)
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->onFailure(fn () => Log::error('AtualizarIndicadoresJob falhou'));
