<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assinante_addons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('addon_key'); // elections | war
            $table->string('status');    // ativo | cancelado | expirado | reembolsado
            $table->string('fonte');     // hotmart | lastlink
            $table->string('order_id')->nullable();
            $table->string('product_id')->nullable();
            $table->timestamp('iniciado_em')->useCurrent();
            $table->timestamp('expira_em')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['addon_key', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assinante_addons');
    }
};
