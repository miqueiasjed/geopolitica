<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresas', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('subdominio')->unique();
            $table->string('logo_url')->nullable();
            $table->boolean('ativo')->default(true);
            $table->unsignedSmallInteger('max_usuarios')->default(5);
            $table->timestamp('expira_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
