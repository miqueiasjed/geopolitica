<?php

namespace Database\Seeders;

use App\Models\Produto;
use Illuminate\Database\Seeder;

class ProdutoSeeder extends Seeder
{
    public function run(): void
    {
        $produtos = [
            [
                'chave'                => 'elections',
                'nome'                 => 'Monitor Eleitoral',
                'descricao'            => 'Acompanhe eleições globais que movem mercados. Briefings eleitorais diários + radar visual dos próximos 12 meses.',
                'preco_label'          => 'R$ 297/ano',
                'link_compra'          => env('LASTLINK_ELECTIONS_URL'),
                'link_reativar'        => null,
                'ativo'                => true,
                'ordem'                => 1,
                'product_id_lastlink'  => env('LASTLINK_PRODUCT_ELECTIONS'),
                'product_id_hotmart'   => env('HOTMART_PRODUCT_ELECTIONS'),
            ],
            [
                'chave'                => 'war',
                'nome'                 => 'Monitor de Guerra',
                'descricao'            => 'Feed em tempo real de conflitos armados e movimentações militares com impacto em mercados de energia e commodities.',
                'preco_label'          => 'R$ 497/ano',
                'link_compra'          => env('LASTLINK_WAR_URL'),
                'link_reativar'        => null,
                'ativo'                => true,
                'ordem'                => 2,
                'product_id_lastlink'  => env('LASTLINK_PRODUCT_WAR'),
                'product_id_hotmart'   => env('HOTMART_PRODUCT_WAR'),
            ],
        ];

        foreach ($produtos as $dados) {
            Produto::updateOrCreate(
                ['chave' => $dados['chave']],
                $dados,
            );
        }
    }
}
