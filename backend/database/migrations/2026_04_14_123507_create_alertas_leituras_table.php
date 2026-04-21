<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertas_leituras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('alerta_id')->constrained('alertas_preditivos')->onDelete('cascade');
            $table->timestamp('lido_em');
            $table->timestamps();

            $table->unique(['user_id', 'alerta_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas_leituras');
    }
};
