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

// M01 – Tier A (notícias): coleta a cada hora
Schedule::job(new ProcessFeedUpdateJob(tier: 'A'))
    ->hourly()
    ->withoutOverlapping();

// M01 – Tier B (think tanks): coleta às 6h e 18h BRT (9h e 21h UTC)
Schedule::job(new ProcessFeedUpdateJob(tier: 'B'))
    ->twiceDaily(9, 21)
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
Schedule::job(new AtualizarIndicadoresJob, 'redis')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->onFailure(fn () => Log::error('AtualizarIndicadoresJob falhou'));

// Perfis de Países – gera análises via IA toda segunda-feira às 03:00
Schedule::command('paises:gerar-perfis')
    ->weeklyOn(1, '03:00')
    ->withoutOverlapping()
    ->runInBackground();

// B2B – desativa empresas com licenças expiradas diariamente às 00:05
Schedule::command('b2b:desativar-expiradas')
    ->dailyAt('00:05')
    ->withoutOverlapping();

// IA – remove logs de ai_logs com mais de 90 dias diariamente às 03:00
Schedule::command('ai:limpar-logs')
    ->dailyAt('03:00')
    ->withoutOverlapping();
