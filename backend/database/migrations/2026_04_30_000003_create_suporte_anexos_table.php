<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suporte_anexos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mensagem_id')->constrained('suporte_mensagens')->cascadeOnDelete();
            $table->string('caminho');
            $table->string('nome_original');
            $table->string('mime_type');
            $table->unsignedBigInteger('tamanho');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suporte_anexos');
    }
};
