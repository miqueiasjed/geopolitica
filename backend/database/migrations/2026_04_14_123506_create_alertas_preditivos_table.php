<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertas_preditivos', function (Blueprint $table) {
            $table->id();
            $table->string('nivel'); // 'medium' | 'high' | 'critical'
            $table->string('regiao');
            $table->string('titulo');
            $table->text('analise');
            $table->json('resumo_sinais');
            $table->integer('peso_total');
            $table->json('tipos_padrao');
            $table->timestamp('notificado_em')->nullable();
            $table->timestamps();

            $table->index(['regiao', 'created_at']);
            $table->index('nivel');
            $table->index('notificado_em');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas_preditivos');
    }
};
