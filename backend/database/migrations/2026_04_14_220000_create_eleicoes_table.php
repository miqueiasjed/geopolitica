<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eleicoes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('pais');
            $table->char('codigo_pais', 2);
            $table->date('data_eleicao');
            $table->string('tipo_eleicao');
            $table->enum('relevancia', ['alta', 'media', 'baixa']);
            $table->text('contexto_geopolitico');
            $table->text('impacto_brasil');
            $table->json('candidatos_principais')->nullable();
            $table->string('content_slug')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eleicoes');
    }
};
