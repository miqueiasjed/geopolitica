<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_sessoes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('data_sessao');
            $table->unsignedInteger('pergunta_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'data_sessao']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_sessoes');
    }
};
