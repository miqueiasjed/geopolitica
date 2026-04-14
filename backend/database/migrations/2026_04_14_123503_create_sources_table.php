<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sources', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('rss_url')->unique();
            $table->string('categoria');
            $table->boolean('ativo')->default(true);
            $table->timestamp('ultima_coleta_em')->nullable();
            $table->timestamps();

            $table->index('categoria');
            $table->index('ativo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sources');
    }
};
