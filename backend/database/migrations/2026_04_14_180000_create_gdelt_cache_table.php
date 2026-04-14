<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gdelt_cache', function (Blueprint $table) {
            $table->id();
            $table->char('codigo_pais', 2)->unique();
            $table->string('nome_pais');
            $table->integer('total_eventos')->default(0);
            $table->decimal('tom_medio', 5, 2)->nullable();
            $table->decimal('intensidade_gdelt', 5, 2);
            $table->timestamp('atualizado_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gdelt_cache');
    }
};
