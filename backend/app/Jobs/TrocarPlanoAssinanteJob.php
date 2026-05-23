<?php

namespace App\Jobs;

use App\Models\Assinante;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class TrocarPlanoAssinanteJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(
        private readonly int $assinanteId,
        private readonly string $novoPlano,
        private readonly string $operacaoId,
    ) {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        try {
            $assinante = Assinante::with('user')->find($this->assinanteId);

            if (! $assinante) {
                $this->registrarErro("Assinante #{$this->assinanteId} não encontrado.");
                return;
            }

            $assinante->update(['plano' => $this->novoPlano]);

            $usuario = $assinante->user;

            if ($usuario) {
                $usuario->syncRoles(['assinante']);
            }

            Cache::increment("troca_plano:{$this->operacaoId}:sucesso");
        } catch (\Throwable $e) {
            $this->registrarErro($e->getMessage());
            Cache::increment("troca_plano:{$this->operacaoId}:erros_count");
        } finally {
            Cache::increment("troca_plano:{$this->operacaoId}:processados");
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->registrarErro($exception->getMessage());
        Cache::increment("troca_plano:{$this->operacaoId}:erros_count");
        Cache::increment("troca_plano:{$this->operacaoId}:processados");
    }

    private function registrarErro(string $mensagem): void
    {
        $key = "troca_plano:{$this->operacaoId}:erros";
        $erros = Cache::get($key, []);

        if (count($erros) < 50) {
            $erros[] = $mensagem;
            Cache::put($key, $erros, now()->addHours(2));
        }
    }
}
