<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Plano;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('planos', function (Blueprint $table) {
            $table->string('role')->nullable()->after('lastlink_url');
        });

        // Preenche os planos existentes com o padrão assinante_{slug}
        Plano::query()->each(function (Plano $plano) {
            $plano->update(['role' => 'assinante_' . $plano->slug]);
        });
    }

    public function down(): void
    {
        Schema::table('planos', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
