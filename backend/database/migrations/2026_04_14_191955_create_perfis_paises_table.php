<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perfis_paises', function (Blueprint $table) {
            $table->char('codigo_pais', 2)->primary();
            $table->string('nome_pt');
            $table->string('bandeira_emoji')->nullable();
            $table->string('regiao_geopolitica');
            $table->text('contexto_geopolitico')->nullable();
            $table->text('analise_lideranca')->nullable();
            $table->json('indicadores_relevantes')->nullable();
            $table->json('termos_busca')->nullable();
            $table->timestamp('gerado_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perfis_paises');
    }
};
