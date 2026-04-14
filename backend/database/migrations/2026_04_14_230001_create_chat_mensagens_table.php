<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_mensagens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('sessao_id')->constrained('chat_sessoes')->cascadeOnDelete();
            $table->enum('role', ['user', 'assistant']);
            $table->text('conteudo');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_mensagens');
    }
};
