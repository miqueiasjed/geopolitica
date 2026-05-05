<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('indicadores_historico')->where('simbolo', 'ZS=F')->delete();
        DB::table('indicadores')->where('simbolo', 'ZS=F')->delete();

        $agora = now();
        DB::table('indicadores')->updateOrInsert(
            ['simbolo' => 'ALI=F'],
            [
                'nome' => 'Alumínio',
                'moeda' => 'USD',
                'unidade' => 'USD/t',
                'updated_at' => $agora,
                'created_at' => $agora,
            ],
        );

        $config = DB::table('configuracoes')->where('chave', 'indicadores_ordem')->first();

        if ($config && is_string($config->valor) && str_contains($config->valor, 'ZS=F')) {
            DB::table('configuracoes')
                ->where('chave', 'indicadores_ordem')
                ->update([
                    'valor' => str_replace('ZS=F', 'ALI=F', $config->valor),
                    'updated_at' => $agora,
                ]);
        }
    }

    public function down(): void
    {
        DB::table('indicadores_historico')->where('simbolo', 'ALI=F')->delete();
        DB::table('indicadores')->where('simbolo', 'ALI=F')->delete();

        $agora = now();
        DB::table('indicadores')->updateOrInsert(
            ['simbolo' => 'ZS=F'],
            [
                'nome' => 'Soja',
                'moeda' => 'USD',
                'unidade' => 'USD/bushel',
                'updated_at' => $agora,
                'created_at' => $agora,
            ],
        );
    }
};
