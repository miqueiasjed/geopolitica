<?php

namespace App\Jobs;

use App\Models\PerfilPais;
use App\Services\GeradorPerfilPaisService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GerarPerfilPaisJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $backoff = 60;

    public function __construct(
        private readonly PerfilPais $pais,
    ) {
        $this->onQueue('default');
    }

    public function handle(GeradorPerfilPaisService $geradorPerfilPaisService): void
    {
        Log::info("Iniciando geração de perfil para: {$this->pais->nome_pt} ({$this->pais->codigo_pais})");

        $geradorPerfilPaisService->gerarPerfil($this->pais);

        Log::info("Perfil gerado com sucesso para: {$this->pais->nome_pt} ({$this->pais->codigo_pais})");
    }
}
