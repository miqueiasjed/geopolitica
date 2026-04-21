<?php

namespace App\Console\Commands;

use App\Models\AiLog;
use Illuminate\Console\Command;

class LimparAiLogsAntigos extends Command
{
    protected $signature = 'ai:limpar-logs {--dias=90 : Número de dias para reter logs}';

    protected $description = 'Remove registros de ai_logs com mais de N dias';

    public function handle(): int
    {
        $dias   = (int) $this->option('dias');
        $corte  = now()->subDays($dias);

        $deletados = AiLog::where('created_at', '<', $corte)->delete();

        $this->info("ai_logs: {$deletados} registros removidos (mais de {$dias} dias).");

        return Command::SUCCESS;
    }
}
