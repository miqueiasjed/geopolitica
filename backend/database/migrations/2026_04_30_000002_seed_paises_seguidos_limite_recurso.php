<?php

use App\Models\Plano;
use App\Models\PlanoRecurso;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $valores = [
            'essencial' => '3',
            'pro'       => '10',
            'reservado' => null,
        ];

        foreach ($valores as $slug => $valor) {
            $plano = Plano::where('slug', $slug)->first();

            if (! $plano) {
                continue;
            }

            PlanoRecurso::updateOrCreate(
                ['plano_id' => $plano->id, 'chave' => 'paises_seguidos_limite'],
                ['valor' => $valor],
            );
        }
    }

    public function down(): void
    {
        PlanoRecurso::where('chave', 'paises_seguidos_limite')->delete();
    }
};
