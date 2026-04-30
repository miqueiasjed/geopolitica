<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_cache', function (Blueprint $table) {
            $table->id();
            $table->string('fonte');
            $table->string('url')->unique();
            $table->string('titulo');
            $table->text('excerpt')->nullable();
            $table->timestamp('publicado_em');
            $table->timestamps();

            $table->index('publicado_em');
            $table->index('fonte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_cache');
    }
};
