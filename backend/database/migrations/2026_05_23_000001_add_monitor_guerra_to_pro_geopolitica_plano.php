<?php

use App\Models\Plano;
use App\Models\PlanoRecurso;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $plano = Plano::where('slug', 'pro-geopolitica')->first();

        if (! $plano) {
            return;
        }

        PlanoRecurso::updateOrCreate(
            ['plano_id' => $plano->id, 'chave' => 'monitor_guerra'],
            ['valor' => 'true']
        );
    }

    public function down(): void
    {
        $plano = Plano::where('slug', 'pro-geopolitica')->first();

        if (! $plano) {
            return;
        }

        PlanoRecurso::where('plano_id', $plano->id)
            ->where('chave', 'monitor_guerra')
            ->delete();
    }
};
