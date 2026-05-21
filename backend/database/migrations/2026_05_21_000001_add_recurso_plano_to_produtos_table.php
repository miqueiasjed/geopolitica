<?php

use App\Models\Produto;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->string('recurso_plano')->nullable()->after('ordem')
                ->comment('Chave do plano_recurso que libera este addon (ex: monitor_eleitoral)');
        });

        // Mapeia os addons existentes para seus recursos de plano
        Produto::where('chave', 'elections')->update(['recurso_plano' => 'monitor_eleitoral']);
        Produto::where('chave', 'war')->update(['recurso_plano' => 'monitor_guerra']);
    }

    public function down(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->dropColumn('recurso_plano');
        });
    }
};
