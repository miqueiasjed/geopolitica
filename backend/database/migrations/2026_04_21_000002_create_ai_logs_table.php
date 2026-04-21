<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_logs', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 20);           // 'claude', 'openai'
            $table->string('modelo', 60);             // ex: 'claude-sonnet-4-6', 'gpt-4o'
            $table->string('servico', 60);            // ex: 'analise_feed', 'chat', 'detector', 'convergencia', 'perfil_pais', 'teste_prompt'
            $table->unsignedInteger('tokens_entrada')->default(0);
            $table->unsignedInteger('tokens_saida')->default(0);
            $table->decimal('custo_estimado_usd', 10, 6)->default(0);
            $table->unsignedInteger('duracao_ms')->default(0);
            $table->boolean('sucesso')->default(true);
            $table->text('erro')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // Sem updated_at — logs são imutáveis
            $table->index(['provider', 'created_at']);
            $table->index(['servico', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_logs');
    }
};
