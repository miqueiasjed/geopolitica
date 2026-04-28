<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carteiras', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            // unique: um portfólio por usuário
            $table->string('nome')->default('Meu Portfólio');
            $table->json('ativos')->nullable();
            // ex: [{"ticker":"PETR4","peso":0.3},{"ticker":"VALE3","peso":0.2}]
            $table->json('ultimo_score')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carteiras');
    }
};
