<?php

namespace Database\Seeders;

use App\Models\Plano;
use App\Models\PlanoRecurso;
use Illuminate\Database\Seeder;

class PlanoSeeder extends Seeder
{
    /**
     * Popula os planos e seus recursos de forma idempotente.
     */
    public function run(): void
    {
        $planos = [
            [
                'slug'  => 'essencial',
                'nome'  => 'Essencial',
                'preco' => 0,
                'ordem' => 1,
            ],
            [
                'slug'  => 'pro',
                'nome'  => 'Pro',
                'preco' => 97.00,
                'ordem' => 2,
            ],
            [
                'slug'  => 'reservado',
                'nome'  => 'Reservado',
                'preco' => 197.00,
                'ordem' => 3,
            ],
        ];

        $recursosPorPlano = [
            'essencial' => [
                'chat_diario_limite'      => '5',
                'relatorio_mensal_limite' => '2',
                'feed_historico_dias'     => '2',
                'feed_paginacao_limite'   => '20',
                'conteudo_historico_dias' => '90',
                'paises_seguidos_limite'  => '3',
                'biblioteca_acesso'       => 'false',
                'monitor_eleitoral'       => 'false',
                'monitor_guerra'          => 'false',
                'risk_score'              => 'false',
                'alertas_nivel'           => 'medium',
            ],
            'pro' => [
                'chat_diario_limite'      => '20',
                'relatorio_mensal_limite' => '10',
                'feed_historico_dias'     => '2',
                'feed_paginacao_limite'   => null,
                'conteudo_historico_dias' => '90',
                'paises_seguidos_limite'  => '10',
                'biblioteca_acesso'       => 'true',
                'monitor_eleitoral'       => 'true',
                'monitor_guerra'          => 'false',
                'risk_score'              => 'true',
                'alertas_nivel'           => 'medium,high',
            ],
            'reservado' => [
                'chat_diario_limite'      => null,
                'relatorio_mensal_limite' => null,
                'feed_historico_dias'     => null,
                'feed_paginacao_limite'   => null,
                'conteudo_historico_dias' => null,
                'paises_seguidos_limite'  => null,
                'biblioteca_acesso'       => 'true',
                'monitor_eleitoral'       => 'true',
                'monitor_guerra'          => 'true',
                'risk_score'              => 'true',
                'alertas_nivel'           => 'all',
            ],
        ];

        foreach ($planos as $dadosPlano) {
            $plano = Plano::updateOrCreate(
                ['slug' => $dadosPlano['slug']],
                [
                    'nome'  => $dadosPlano['nome'],
                    'preco' => $dadosPlano['preco'],
                    'ordem' => $dadosPlano['ordem'],
                    'ativo' => true,
                ]
            );

            $recursos = $recursosPorPlano[$dadosPlano['slug']] ?? [];

            foreach ($recursos as $chave => $valor) {
                PlanoRecurso::updateOrCreate(
                    [
                        'plano_id' => $plano->id,
                        'chave'    => $chave,
                    ],
                    [
                        'valor' => $valor,
                    ]
                );
            }
        }
    }
}
