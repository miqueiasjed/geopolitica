<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('slug', 50)->unique();
            $table->string('nome', 100);
            $table->text('descricao')->nullable();
            $table->decimal('preco', 10, 2)->default(0);
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });

        Schema::create('plano_recursos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('plano_id')->constrained('planos')->cascadeOnDelete();
            $table->string('chave', 100);
            $table->string('valor', 255)->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();

            $table->unique(['plano_id', 'chave']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plano_recursos');
        Schema::dropIfExists('planos');
    }
};
