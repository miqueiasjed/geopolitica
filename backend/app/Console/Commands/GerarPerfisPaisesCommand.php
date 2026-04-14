<?php

namespace App\Console\Commands;

use App\Models\PerfilPais;
use App\Services\GeradorPerfilPaisService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GerarPerfisPaisesCommand extends Command
{
    protected $signature = 'paises:gerar-perfis';

    protected $description = 'Gera perfis de países via IA (máx 5 por execução)';

    public function handle(GeradorPerfilPaisService $geradorPerfilPaisService): int
    {
        $paises = PerfilPais::orderByRaw('gerado_em IS NULL DESC, gerado_em ASC')
            ->limit(5)
            ->get();

        if ($paises->isEmpty()) {
            $this->info('Nenhum país encontrado para processar.');

            return self::SUCCESS;
        }

        $this->info("Processando {$paises->count()} país(es)...");

        foreach ($paises as $indice => $pais) {
            $this->info("[{$indice}/{$paises->count()}] Gerando perfil para: {$pais->nome_pt} ({$pais->codigo_pais})");

            try {
                $geradorPerfilPaisService->gerarPerfil($pais);
                $this->info("  Perfil gerado com sucesso para: {$pais->nome_pt}");
            } catch (\Throwable $throwable) {
                $this->error("  Erro ao gerar perfil para {$pais->nome_pt}: {$throwable->getMessage()}");
                Log::error("Falha ao gerar perfil para {$pais->codigo_pais}", [
                    'erro' => $throwable->getMessage(),
                ]);
            }

            if ($indice < $paises->count() - 1) {
                sleep(2);
            }
        }

        $this->info('Processamento concluído.');

        return self::SUCCESS;
    }
}
