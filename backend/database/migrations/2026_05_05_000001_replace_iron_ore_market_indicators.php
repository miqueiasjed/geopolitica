<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('indicadores_historico')->where('simbolo', 'TIO=F')->delete();
        DB::table('indicadores')->where('simbolo', 'TIO=F')->delete();

        $agora = now();
        $indicadores = [
            ['CL=F', 'Petróleo WTI', 'USD', 'USD/barril'],
            ['HG=F', 'Cobre', 'USD', 'USD/t'],
            ['ZC=F', 'Milho', 'USD', 'USD/bushel'],
            ['KC=F', 'Café', 'USD', 'US cents/lb'],
        ];

        foreach ($indicadores as [$simbolo, $nome, $moeda, $unidade]) {
            DB::table('indicadores')->updateOrInsert(
                ['simbolo' => $simbolo],
                [
                    'nome' => $nome,
                    'moeda' => $moeda,
                    'unidade' => $unidade,
                    'updated_at' => $agora,
                    'created_at' => $agora,
                ],
            );
        }
    }

    public function down(): void
    {
        DB::table('indicadores_historico')
            ->whereIn('simbolo', ['CL=F', 'HG=F', 'ZC=F', 'KC=F'])
            ->delete();

        DB::table('indicadores')
            ->whereIn('simbolo', ['CL=F', 'HG=F', 'ZC=F', 'KC=F'])
            ->delete();

        $agora = now();
        DB::table('indicadores')->updateOrInsert(
            ['simbolo' => 'TIO=F'],
            [
                'nome' => 'Minério de Ferro',
                'moeda' => 'USD',
                'unidade' => 'USD/t',
                'updated_at' => $agora,
                'created_at' => $agora,
            ],
        );
    }
};
