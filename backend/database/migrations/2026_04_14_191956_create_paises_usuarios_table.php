<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paises_usuarios', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('codigo_pais', 2);
            $table->timestamp('adicionado_em')->useCurrent();

            $table->unique(['user_id', 'codigo_pais']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paises_usuarios');
    }
};
