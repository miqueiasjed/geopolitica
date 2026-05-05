<?php

namespace Database\Seeders;

use App\Models\Indicador;
use Illuminate\Database\Seeder;

class IndicadoresSeeder extends Seeder
{
    public function run(): void
    {
        $indicadores = [
            [
                'simbolo' => 'CL=F',
                'nome'    => 'Petróleo WTI',
                'moeda'   => 'USD',
                'unidade' => 'USD/barril',
            ],
            [
                'simbolo' => 'BZ=F',
                'nome'    => 'Petróleo Brent',
                'moeda'   => 'USD',
                'unidade' => 'USD/barril',
            ],
            [
                'simbolo' => 'USDBRL=X',
                'nome'    => 'Câmbio BRL/USD',
                'moeda'   => 'BRL',
                'unidade' => 'R$/USD',
            ],
            [
                'simbolo' => 'NG=F',
                'nome'    => 'Gás Natural',
                'moeda'   => 'USD',
                'unidade' => 'USD/MMBtu',
            ],
            [
                'simbolo' => 'ALI=F',
                'nome'    => 'Alumínio',
                'moeda'   => 'USD',
                'unidade' => 'USD/t',
            ],
            [
                'simbolo' => 'ZW=F',
                'nome'    => 'Trigo',
                'moeda'   => 'USD',
                'unidade' => 'USD/bushel',
            ],
            [
                'simbolo' => 'HG=F',
                'nome'    => 'Cobre',
                'moeda'   => 'USD',
                'unidade' => 'USD/t',
            ],
            [
                'simbolo' => 'ZC=F',
                'nome'    => 'Milho',
                'moeda'   => 'USD',
                'unidade' => 'USD/bushel',
            ],
            [
                'simbolo' => 'KC=F',
                'nome'    => 'Café',
                'moeda'   => 'USD',
                'unidade' => 'US cents/lb',
            ],
        ];

        foreach ($indicadores as $dados) {
            Indicador::firstOrCreate(
                ['simbolo' => $dados['simbolo']],
                array_merge($dados, ['valor' => 0])
            );
        }
    }
}
