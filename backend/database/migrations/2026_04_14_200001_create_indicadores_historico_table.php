<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indicadores_historico', function (Blueprint $table) {
            $table->id();
            $table->string('simbolo');
            $table->decimal('valor', 15, 4);
            $table->timestamp('registrado_em');
            $table->timestamp('created_at');

            $table->index(['simbolo', 'registrado_em']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indicadores_historico');
    }
};
