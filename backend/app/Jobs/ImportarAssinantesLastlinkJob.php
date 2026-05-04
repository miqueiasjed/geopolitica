<?php

namespace App\Jobs;

use App\Services\ImportacaoAssinantesService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class ImportarAssinantesLastlinkJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(
        private readonly array $linha,
        private readonly string $importacaoId,
        private readonly string $senhaPadrao,
        private readonly bool $enviarEmail,
    ) {
        $this->onQueue('default');
    }

    public function handle(ImportacaoAssinantesService $service): void
    {
        try {
            $service->processarLinha($this->linha, $this->senhaPadrao, $this->enviarEmail);
        } catch (\Throwable $e) {
            $this->registrarErro($e->getMessage());
            Cache::increment("importacao:lastlink:{$this->importacaoId}:erros_count");
        } finally {
            Cache::increment("importacao:lastlink:{$this->importacaoId}:processados");
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->registrarErro($exception->getMessage());
        Cache::increment("importacao:lastlink:{$this->importacaoId}:erros_count");
        Cache::increment("importacao:lastlink:{$this->importacaoId}:processados");
    }

    private function registrarErro(string $mensagem): void
    {
        $key = "importacao:lastlink:{$this->importacaoId}:erros";
        $erros = Cache::get($key, []);

        if (count($erros) < 50) {
            $erros[] = $mensagem;
            Cache::put($key, $erros, now()->addHours(2));
        }
    }
}
