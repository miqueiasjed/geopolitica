<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conteudos', function (Blueprint $table) {
            // null = GPI Core; 'elections' | 'war' = vertical específica
            $table->string('vertical_conteudo')->nullable()->after('plano_minimo');
            $table->index('vertical_conteudo');
        });
    }

    public function down(): void
    {
        Schema::table('conteudos', function (Blueprint $table) {
            $table->dropIndex(['vertical_conteudo']);
            $table->dropColumn('vertical_conteudo');
        });
    }
};
