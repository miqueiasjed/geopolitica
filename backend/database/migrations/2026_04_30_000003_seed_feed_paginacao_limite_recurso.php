<?php

use App\Models\Plano;
use App\Models\PlanoRecurso;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $valores = [
            'essencial' => '20',
            'pro'       => null,
            'reservado' => null,
        ];

        foreach ($valores as $slug => $valor) {
            $plano = Plano::where('slug', $slug)->first();

            if (! $plano) {
                continue;
            }

            PlanoRecurso::updateOrCreate(
                ['plano_id' => $plano->id, 'chave' => 'feed_paginacao_limite'],
                ['valor' => $valor],
            );
        }
    }

    public function down(): void
    {
        PlanoRecurso::where('chave', 'feed_paginacao_limite')->delete();
    }
};
