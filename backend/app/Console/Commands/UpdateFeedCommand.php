<?php

namespace App\Console\Commands;

use App\Jobs\ProcessFeedUpdateJob;
use App\Services\FeedUpdaterService;
use Illuminate\Console\Command;

class UpdateFeedCommand extends Command
{
    protected $signature = 'feed:update {--sync : Executa o pipeline sem despachar para a fila}';

    protected $description = 'Atualiza o feed de tensões geopolíticas.';

    public function handle(FeedUpdaterService $feedUpdaterService): int
    {
        if ($this->option('sync')) {
            $resultado = $feedUpdaterService->atualizar();

            $this->info(sprintf(
                'Feed atualizado. Coletados: %d | Novos: %d | Salvos: %d',
                $resultado['coletados'],
                $resultado['novos'],
                $resultado['salvos'],
            ));

            return self::SUCCESS;
        }

        ProcessFeedUpdateJob::dispatch();
        $this->info('Atualização do feed despachada para a fila.');

        return self::SUCCESS;
    }
}
