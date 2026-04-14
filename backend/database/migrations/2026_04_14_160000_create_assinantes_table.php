<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assinantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plano');
            $table->boolean('ativo')->default(false);
            $table->string('status');
            $table->string('hotmart_subscriber_code')->nullable();
            $table->timestamp('assinado_em')->nullable();
            $table->timestamp('expira_em')->nullable();
            $table->timestamps();

            $table->unique('user_id');
            $table->index(['ativo', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assinantes');
    }
};
