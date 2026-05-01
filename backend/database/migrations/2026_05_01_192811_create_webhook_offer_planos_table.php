<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('webhook_offer_planos', function (Blueprint $table) {
            $table->id();
            $table->enum('fonte', ['hotmart', 'lastlink']);
            $table->string('offer_id');
            $table->string('descricao');
            $table->enum('plano', ['essencial', 'pro', 'reservado']);
            $table->timestamps();

            $table->unique(['fonte', 'offer_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_offer_planos');
    }
};
