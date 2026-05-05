<?php

use App\Models\Plano;
use App\Models\PlanoRecurso;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private const NIVEIS = [
        'essencial' => 'essencial',
        'pro'       => 'pro',
        'reservado' => 'todos',
    ];

    public function up(): void
    {
        Plano::query()->each(function (Plano $plano) {
            $nivel = self::NIVEIS[$plano->slug] ?? 'essencial';

            PlanoRecurso::updateOrCreate(
                ['plano_id' => $plano->id, 'chave' => 'conteudo_nivel_maximo'],
                ['valor' => $nivel],
            );
        });
    }

    public function down(): void
    {
        PlanoRecurso::where('chave', 'conteudo_nivel_maximo')->delete();
    }
};
