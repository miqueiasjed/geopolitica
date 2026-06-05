<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Support\CategoriaNormalizer;
use Illuminate\Console\Command;

class NormalizarCategoriasCommand extends Command
{
    protected $signature = 'feed:normalizar-categorias
        {--dias=60 : Quantos dias para trás reprocessar}
        {--dry-run : Apenas mostra o que mudaria, sem gravar}';

    protected $description = 'Reaplica a normalização de categorias nos eventos existentes (ex.: "câmbio"/"forex" passam a incluir o slug "cambio").';

    public function handle(): int
    {
        $dias = max(1, (int) $this->option('dias'));
        $dryRun = (bool) $this->option('dry-run');

        $eventos = Event::query()
            ->where('created_at', '>=', now()->subDays($dias))
            ->get(['id', 'categorias']);

        if ($eventos->isEmpty()) {
            $this->info("Nenhum evento nos últimos {$dias} dias.");
            return self::SUCCESS;
        }

        $this->info("Analisando {$eventos->count()} eventos dos últimos {$dias} dias" . ($dryRun ? ' (dry-run)' : '') . '...');

        $atualizados = 0;
        $exemplos = [];

        foreach ($eventos as $evento) {
            $atual = (array) ($evento->categorias ?? []);
            $novo = CategoriaNormalizer::normalizar($atual);

            // Só grava quando o conjunto de fato muda (compara sem depender da ordem).
            $antesOrdenado = $atual;
            $depoisOrdenado = $novo;
            sort($antesOrdenado);
            sort($depoisOrdenado);

            if ($antesOrdenado === $depoisOrdenado) {
                continue;
            }

            if (count($exemplos) < 10) {
                $exemplos[] = sprintf('  #%d: %s → %s', $evento->id, json_encode($atual, JSON_UNESCAPED_UNICODE), json_encode($novo, JSON_UNESCAPED_UNICODE));
            }

            if (! $dryRun) {
                $evento->update(['categorias' => $novo]);
            }

            $atualizados++;
        }

        if ($exemplos) {
            $this->line('Exemplos:');
            foreach ($exemplos as $linha) {
                $this->line($linha);
            }
        }

        $verbo = $dryRun ? 'seriam atualizados' : 'atualizados';
        $this->info("Concluído: {$atualizados} eventos {$verbo}.");

        return self::SUCCESS;
    }
}
