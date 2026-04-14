<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indicadores', function (Blueprint $table) {
            $table->id();
            $table->string('simbolo')->unique();
            $table->string('nome');
            $table->decimal('valor', 15, 4)->nullable();
            $table->string('moeda');
            $table->string('unidade');
            $table->decimal('variacao_pct', 8, 4)->nullable();
            $table->decimal('variacao_abs', 15, 4)->nullable();
            $table->timestamp('atualizado_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indicadores');
    }
};
