<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conteudos', function (Blueprint $table) {
            $table->id();
            $table->string('tipo'); // briefing | mapa | tese
            $table->string('titulo');
            $table->string('slug')->unique();
            $table->longText('corpo'); // HTML
            $table->text('resumo');
            $table->string('regiao')->nullable();
            $table->json('tags')->nullable(); // array de strings
            $table->string('tese_manchete')->nullable(); // só para tipo tese
            $table->string('plano_minimo'); // essencial | pro | reservado
            $table->boolean('publicado')->default(false);
            $table->timestamp('publicado_em')->nullable();
            $table->timestamps();

            $table->fullText(['titulo', 'corpo']);
            $table->index(['tipo', 'regiao', 'publicado', 'publicado_em'], 'conteudos_tipo_regiao_publicado_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conteudos');
    }
};
