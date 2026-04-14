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
                'simbolo' => 'ZS=F',
                'nome'    => 'Soja',
                'moeda'   => 'USD',
                'unidade' => 'USD/bushel',
            ],
            [
                'simbolo' => 'ZW=F',
                'nome'    => 'Trigo',
                'moeda'   => 'USD',
                'unidade' => 'USD/bushel',
            ],
            [
                'simbolo' => 'TIO=F',
                'nome'    => 'Minério de Ferro',
                'moeda'   => 'USD',
                'unidade' => 'USD/t',
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
