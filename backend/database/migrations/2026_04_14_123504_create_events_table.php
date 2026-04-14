<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('resumo')->nullable();
            $table->text('analise_ia')->nullable();
            $table->string('fonte');
            $table->string('fonte_url')->unique();
            $table->string('regiao')->nullable();
            $table->unsignedTinyInteger('impact_score')->default(1);
            $table->string('impact_label')->default('MONITORAR');
            $table->json('categorias')->nullable();
            $table->boolean('relevante')->default(false);
            $table->timestamp('publicado_em');
            $table->timestamps();

            $table->index('regiao');
            $table->index('impact_score');
            $table->index('relevante');
            $table->index('publicado_em');

            if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
                $table->fullText(['titulo', 'resumo']);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
