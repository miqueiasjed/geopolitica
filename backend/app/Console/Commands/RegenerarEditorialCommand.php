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
                            {--limite=20 : Máximo de eventos a processar por execução}
                            {--delay=5 : Segundos de pausa entre cada chamada à IA}
                            {--dry-run : Lista os eventos sem gerar editorial}';

    protected $description = 'Força a geração de editorial (headline + legenda) para eventos das últimas N horas que falharam ou estão incompletos.';

    private const RATE_LIMIT_WAIT = 60;
    private const MAX_RETRIES     = 2;

    public function handle(EditorialService $editorialService): int
    {
        $horas   = (int) $this->option('horas');
        $limite  = max(1, (int) $this->option('limite'));
        $delay   = max(0, (int) $this->option('delay'));
        $dryRun  = (bool) $this->option('dry-run');
        $desde   = now()->subHours($horas);

        $eventos = Event::where('publicado_em', '>=', $desde)
            ->where(function ($q) {
                $q->where(function ($inner) {
                    $inner->where('relevante', true)
                          ->where(fn ($i) => $i->whereNull('headline')->orWhereNull('legenda'));
                })->orWhere(function ($inner) {
                    $inner->where('relevante', false)
                          ->whereNotNull('analise_ia')
                          ->whereNull('headline');
                });
            })
            ->orderBy('publicado_em', 'desc')
            ->limit($limite)
            ->get();

        $total = Event::where('publicado_em', '>=', $desde)
            ->where(function ($q) {
                $q->where(function ($inner) {
                    $inner->where('relevante', true)
                          ->where(fn ($i) => $i->whereNull('headline')->orWhereNull('legenda'));
                })->orWhere(function ($inner) {
                    $inner->where('relevante', false)
                          ->whereNotNull('analise_ia')
                          ->whereNull('headline');
                });
            })
            ->count();

        if ($eventos->isEmpty()) {
            $this->info("Nenhum evento pendente nas últimas {$horas} horas.");
            return self::SUCCESS;
        }

        $restantes = max(0, $total - $eventos->count());
        $this->info("Pendentes: {$total} — processando: {$eventos->count()} — ficarão para próxima execução: {$restantes}");
        $this->info("Delay entre chamadas: {$delay}s | Backoff em rate limit: " . self::RATE_LIMIT_WAIT . "s");

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
            $gerado = $this->tentarGerar($editorialService, $evento);

            if ($gerado) {
                $sucesso++;
            } else {
                $falha++;
            }

            $bar->advance();

            if ($delay > 0) {
                sleep($delay);
            }
        }

        $bar->finish();
        $this->newLine();

        $this->table(
            ['Resultado', 'Quantidade'],
            [
                ['Gerados com sucesso',          $sucesso],
                ['Falhas',                        $falha],
                ['Total processado',              $eventos->count()],
                ['Ainda pendentes (próx. exec.)', $restantes],
            ]
        );

        if ($restantes > 0) {
            $this->warn("Execute novamente para processar os {$restantes} eventos restantes.");
        }

        return self::SUCCESS;
    }

    private function tentarGerar(EditorialService $editorialService, Event $evento): bool
    {
        for ($tentativa = 1; $tentativa <= self::MAX_RETRIES; $tentativa++) {
            try {
                $editorial = $editorialService->gerar($evento);

                $evento->update([
                    'headline'  => $editorial['headline'],
                    'legenda'   => $editorial['legenda'],
                    'relevante' => true,
                ]);

                Log::channel('pipeline')->info('[RegenerarEditorial] Editorial gerado com sucesso.', [
                    'event_id'  => $evento->id,
                    'tentativa' => $tentativa,
                ]);

                return true;
            } catch (\Throwable $e) {
                $isRateLimit = str_contains(strtolower($e->getMessage()), 'rate limit');

                Log::channel('pipeline')->warning('[RegenerarEditorial] Falha ao gerar editorial.', [
                    'event_id'   => $evento->id,
                    'tentativa'  => $tentativa,
                    'rate_limit' => $isRateLimit,
                    'erro'       => $e->getMessage(),
                ]);

                if ($isRateLimit && $tentativa < self::MAX_RETRIES) {
                    $this->newLine();
                    $this->warn("Rate limit atingido — aguardando " . self::RATE_LIMIT_WAIT . "s antes de tentar novamente...");
                    sleep(self::RATE_LIMIT_WAIT);
                    continue;
                }

                // Erro não recuperável ou última tentativa
                break;
            }
        }

        return false;
    }
}
