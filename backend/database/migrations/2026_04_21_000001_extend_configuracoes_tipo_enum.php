<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuracoes', function (Blueprint $table) {
            $table->enum('tipo', ['texto', 'senha', 'numero', 'select', 'textarea'])
                ->default('texto')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('configuracoes', function (Blueprint $table) {
            $table->enum('tipo', ['texto', 'senha', 'numero'])
                ->default('texto')
                ->change();
        });
    }
};
