<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sinais_padrao', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->string('tipo_padrao'); // 'military' | 'diplomatic' | 'supply'
            $table->string('nome_sinal');
            $table->string('regiao');
            $table->tinyInteger('peso');
            $table->decimal('confianca', 5, 2);
            $table->timestamp('analisado_em');
            $table->timestamps();

            $table->index(['event_id', 'tipo_padrao']);
            $table->index(['regiao', 'analisado_em']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sinais_padrao');
    }
};
