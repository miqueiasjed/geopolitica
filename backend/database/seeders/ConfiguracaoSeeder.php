<?php

namespace Database\Seeders;

use App\Models\Configuracao;
use App\Services\ConfiguracaoService;
use Illuminate\Database\Seeder;

class ConfiguracaoSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(ConfiguracaoService::class);

        foreach ($service->definicoes() as $def) {
            Configuracao::firstOrCreate(
                ['chave' => $def['chave']],
                [
                    'valor'     => null,
                    'grupo'     => $def['grupo'],
                    'label'     => $def['label'],
                    'descricao' => $def['descricao'] ?? null,
                    'tipo'      => $def['tipo'],
                    'sensivel'  => $def['sensivel'],
                ]
            );
        }
    }
}
