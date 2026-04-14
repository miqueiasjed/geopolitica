<?php

namespace App\Jobs;

use App\Models\GdeltCache;
use App\Services\GdeltFetcherService;
use App\Services\MapaIntensidadeService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class AtualizarGdeltJob implements ShouldQueue
{
    use Queueable;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct()
    {
        //
    }

    public function handle(
        GdeltFetcherService $fetcher,
        MapaIntensidadeService $mapaService
    ): void {
        Log::info('AtualizarGdeltJob: iniciando busca de dados GDELT.');

        $registros = $fetcher->fetch();

        if (empty($registros)) {
            Log::warning('AtualizarGdeltJob: nenhum registro retornado pela GDELT API. Upsert ignorado.');

            return;
        }

        GdeltCache::upsert(
            $registros,
            ['codigo_pais'],
            ['nome_pais', 'total_eventos', 'tom_medio', 'intensidade_gdelt', 'atualizado_em']
        );

        Log::info('AtualizarGdeltJob: upsert concluído.', [
            'total_registros' => count($registros),
        ]);

        $mapaService->invalidar();

        Log::info('AtualizarGdeltJob: cache do mapa de intensidade invalidado.');
    }
}
