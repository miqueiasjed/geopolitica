<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Services\EditorialService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RegenerarEditorialCommand extends Command
{
    protected $signature = 'feed:regenerar-editorial
                            {--horas=48 : Janela de tempo em horas para buscar eventos}
                            {--dry-run : Lista os eventos sem gerar editorial}';

    protected $description = 'Força a geração de editorial (headline + legenda) para eventos das últimas N horas que falharam ou estão incompletos.';

    public function handle(EditorialService $editorialService): int
    {
        $horas   = (int) $this->option('horas');
        $dryRun  = (bool) $this->option('dry-run');
        $desde   = now()->subHours($horas);

        // Cenário 1: relevante=true mas sem headline ou legenda (bug de persistência)
        // Cenário 2: relevante=false com analise_ia preenchida (editorial falhou após análise IA)
        $eventos = Event::where('publicado_em', '>=', $desde)
            ->where(function ($q) {
                $q->where(function ($inner) {
                    // Relevantes sem editorial completo
                    $inner->where('relevante', true)
                          ->where(fn ($i) => $i->whereNull('headline')->orWhereNull('legenda'));
                })->orWhere(function ($inner) {
                    // Não relevantes que passaram pela IA mas falharam no editorial
                    $inner->where('relevante', false)
                          ->whereNotNull('analise_ia')
                          ->whereNull('headline');
                });
            })
            ->orderBy('publicado_em', 'desc')
            ->get();

        if ($eventos->isEmpty()) {
            $this->info("Nenhum evento pendente nas últimas {$horas} horas.");
            return self::SUCCESS;
        }

        $this->info("Eventos pendentes encontrados: {$eventos->count()} (últimas {$horas}h)");

        if ($dryRun) {
            $this->table(
                ['ID', 'Título', 'Relevante', 'Headline', 'Analise IA', 'Publicado em'],
                $eventos->map(fn ($e) => [
                    $e->id,
                    str($e->titulo)->limit(60),
                    $e->relevante ? 'sim' : 'não',
                    $e->headline ? 'sim' : 'NÃO',
                    $e->analise_ia ? 'sim' : 'NÃO',
                    $e->publicado_em?->format('d/m H:i'),
                ])
            );
            return self::SUCCESS;
        }

        $sucesso = 0;
        $falha   = 0;

        $bar = $this->output->createProgressBar($eventos->count());
        $bar->start();

        foreach ($eventos as $evento) {
            try {
                $editorial = $editorialService->gerar($evento);

                $evento->update([
                    'headline'  => $editorial['headline'],
                    'legenda'   => $editorial['legenda'],
                    'relevante' => true,
                ]);

                Log::channel('pipeline')->info('[RegenerarEditorial] Editorial gerado com sucesso.', [
                    'event_id' => $evento->id,
                    'titulo'   => $evento->titulo,
                ]);

                $sucesso++;
            } catch (\Throwable $e) {
                Log::channel('pipeline')->warning('[RegenerarEditorial] Falha ao gerar editorial.', [
                    'event_id' => $evento->id,
                    'erro'     => $e->getMessage(),
                ]);

                $falha++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        $this->table(
            ['Resultado', 'Quantidade'],
            [
                ['Gerados com sucesso', $sucesso],
                ['Falhas',              $falha],
                ['Total processado',    $eventos->count()],
            ]
        );

        return self::SUCCESS;
    }
}
