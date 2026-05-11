<?php

namespace App\Jobs;

use App\Models\Event;
use App\Services\EditorialService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ReprocessarEditorialJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 8;

    public int $timeout = 120;

    public function __construct(
        private readonly int $eventoId,
        private readonly string $operacaoId,
    ) {
        $this->onQueue('default');
    }

    public function handle(EditorialService $editorialService): void
    {
        $evento = Event::find($this->eventoId);

        if (! $evento) {
            $this->registrarErro("Evento #{$this->eventoId} não encontrado.");
            Cache::increment("reprocessar_editorial:{$this->operacaoId}:processados");
            return;
        }

        try {
            $editorial = $editorialService->gerar($evento);

            $evento->update([
                'headline'  => $editorial['headline'],
                'legenda'   => $editorial['legenda'],
                'relevante' => true,
            ]);

            Cache::increment("reprocessar_editorial:{$this->operacaoId}:sucesso");

            Log::channel('pipeline')->info('[ReprocessarEditorial] Editorial gerado.', [
                'event_id'    => $evento->id,
                'operacao_id' => $this->operacaoId,
                'tentativa'   => $this->attempts(),
            ]);
        } catch (\Throwable $e) {
            if ($this->isRateLimit($e)) {
                Log::channel('pipeline')->warning('[ReprocessarEditorial] Rate limit — reagendando em 60s.', [
                    'event_id'  => $evento->id,
                    'tentativa' => $this->attempts(),
                ]);

                $this->release(60);
                return;
            }

            $this->registrarErro($e->getMessage());
            Cache::increment("reprocessar_editorial:{$this->operacaoId}:erros_count");
        }

        Cache::increment("reprocessar_editorial:{$this->operacaoId}:processados");
    }

    public function failed(\Throwable $exception): void
    {
        $this->registrarErro($exception->getMessage());
        Cache::increment("reprocessar_editorial:{$this->operacaoId}:erros_count");
        Cache::increment("reprocessar_editorial:{$this->operacaoId}:processados");
    }

    private function isRateLimit(\Throwable $e): bool
    {
        return str_contains(strtolower($e->getMessage()), 'rate limit');
    }

    private function registrarErro(string $mensagem): void
    {
        $key  = "reprocessar_editorial:{$this->operacaoId}:erros";
        $erros = Cache::get($key, []);

        if (count($erros) < 50) {
            $erros[] = "Evento #{$this->eventoId}: {$mensagem}";
            Cache::put($key, $erros, now()->addHours(4));
        }
    }
}
