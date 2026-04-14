<?php

namespace Database\Seeders;

use App\Models\Conteudo;
use Illuminate\Database\Seeder;

class ConteudoSeeder extends Seeder
{
    public function run(): void
    {
        $conteudos = [
            // Plano: essencial
            [
                'tipo'         => 'briefing',
                'titulo'       => 'Briefing Geopolítico – Tensões no Leste Europeu',
                'resumo'       => 'Análise das tensões recentes na fronteira leste da Europa e impactos para investidores.',
                'corpo'        => '<p>Conteúdo completo do briefing sobre tensões no Leste Europeu.</p>',
                'regiao'       => 'Europa',
                'tags'         => ['geopolitica', 'europa', 'tensoes'],
                'plano_minimo' => 'essencial',
                'publicado_em' => now()->subDays(10), // dentro dos 90 dias
            ],
            [
                'tipo'         => 'mapa',
                'titulo'       => 'Mapa de Calor – Risco Político na América Latina',
                'resumo'       => 'Visualização do risco político nos principais países da América Latina.',
                'corpo'        => '<p>Conteúdo completo do mapa de risco político na América Latina.</p>',
                'regiao'       => 'América Latina',
                'tags'         => ['mapa', 'risco', 'america-latina'],
                'plano_minimo' => 'essencial',
                'publicado_em' => now()->subDays(30), // dentro dos 90 dias
            ],
            [
                'tipo'         => 'tese',
                'titulo'       => 'Tese de Investimento – Commodities Agrícolas 2026',
                'resumo'       => 'Tese sobre oportunidades em commodities agrícolas para o ano de 2026.',
                'corpo'        => '<p>Conteúdo completo da tese sobre commodities agrícolas.</p>',
                'regiao'       => 'Global',
                'tags'         => ['tese', 'commodities', 'agricultura'],
                'tese_manchete' => 'Commodities Agrícolas como Hedge Geopolítico em 2026',
                'plano_minimo' => 'essencial',
                'publicado_em' => now()->subDays(80), // dentro dos 90 dias
            ],

            // Plano: pro
            [
                'tipo'         => 'briefing',
                'titulo'       => 'Briefing Pro – Conflito no Oriente Médio e Petróleo',
                'resumo'       => 'Análise aprofundada dos reflexos do conflito no Oriente Médio sobre o preço do petróleo.',
                'corpo'        => '<p>Conteúdo completo do briefing pro sobre Oriente Médio e petróleo.</p>',
                'regiao'       => 'Oriente Médio',
                'tags'         => ['oriente-medio', 'petroleo', 'conflito'],
                'plano_minimo' => 'pro',
                'publicado_em' => now()->subDays(5), // dentro dos 90 dias
            ],
            [
                'tipo'         => 'mapa',
                'titulo'       => 'Mapa Pro – Fluxo de Capital Institucional na Ásia',
                'resumo'       => 'Mapeamento do fluxo de capital institucional nos principais mercados asiáticos.',
                'corpo'        => '<p>Conteúdo completo do mapa pro sobre fluxo de capital na Ásia.</p>',
                'regiao'       => 'Ásia',
                'tags'         => ['asia', 'capital', 'institucional'],
                'plano_minimo' => 'pro',
                'publicado_em' => now()->subDays(60), // dentro dos 90 dias
            ],
            [
                'tipo'         => 'tese',
                'titulo'       => 'Tese Pro – Ouro como Reserva Estratégica',
                'resumo'       => 'Tese aprofundada sobre o papel do ouro como reserva estratégica em cenários de crise.',
                'corpo'        => '<p>Conteúdo completo da tese pro sobre ouro como reserva estratégica.</p>',
                'regiao'       => 'Global',
                'tags'         => ['ouro', 'reserva', 'crise'],
                'tese_manchete' => 'Ouro: O Ativo Definitivo em Cenários de Ruptura Geopolítica',
                'plano_minimo' => 'pro',
                'publicado_em' => now()->subDays(95), // fora dos 90 dias — testa restrição
            ],

            // Plano: reservado
            [
                'tipo'         => 'briefing',
                'titulo'       => 'Briefing Reservado – Inteligência sobre Sanções Russas',
                'resumo'       => 'Inteligência exclusiva sobre o impacto das sanções russas em mercados emergentes.',
                'corpo'        => '<p>Conteúdo completo do briefing reservado sobre sanções russas.</p>',
                'regiao'       => 'Europa',
                'tags'         => ['russia', 'sancoes', 'emergentes'],
                'plano_minimo' => 'reservado',
                'publicado_em' => now()->subDays(15), // dentro dos 90 dias
            ],
            [
                'tipo'         => 'mapa',
                'titulo'       => 'Mapa Reservado – Rotas de Suprimento Global em Risco',
                'resumo'       => 'Mapeamento exclusivo das principais rotas de suprimento global sob ameaça geopolítica.',
                'corpo'        => '<p>Conteúdo completo do mapa reservado sobre rotas de suprimento.</p>',
                'regiao'       => 'Global',
                'tags'         => ['logistica', 'suprimento', 'risco-global'],
                'plano_minimo' => 'reservado',
                'publicado_em' => now()->subDays(100), // fora dos 90 dias — testa que reservado vê histórico completo
            ],
            [
                'tipo'         => 'tese',
                'titulo'       => 'Tese Reservada – Reconfiguração da Ordem Monetária Global',
                'resumo'       => 'Análise exclusiva sobre a reconfiguração da ordem monetária internacional pós-dólar.',
                'corpo'        => '<p>Conteúdo completo da tese reservada sobre a nova ordem monetária global.</p>',
                'regiao'       => 'Global',
                'tags'         => ['moeda', 'dolar', 'ordem-monetaria'],
                'tese_manchete' => 'A Grande Reconfiguração: Para Onde Vai a Reserva de Valor Global?',
                'plano_minimo' => 'reservado',
                'publicado_em' => now()->subDays(50), // dentro dos 90 dias
            ],
        ];

        foreach ($conteudos as $dados) {
            Conteudo::create(array_merge($dados, [
                'slug'      => Conteudo::gerarSlug($dados['titulo']),
                'publicado' => true,
            ]));
        }
    }
}
