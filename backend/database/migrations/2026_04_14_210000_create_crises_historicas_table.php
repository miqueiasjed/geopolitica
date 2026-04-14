<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crises_historicas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('titulo');
            $table->string('slug')->unique();
            $table->smallInteger('ano');
            $table->date('data_inicio');
            $table->date('data_fim')->nullable();
            $table->text('contexto_geopolitico');
            $table->text('impacto_global');
            $table->text('impacto_brasil');
            $table->json('metricas_globais')->default('[]');
            $table->json('metricas_brasil')->default('[]');
            $table->json('categorias')->default('[]');
            $table->string('content_slug')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crises_historicas');
    }
};
