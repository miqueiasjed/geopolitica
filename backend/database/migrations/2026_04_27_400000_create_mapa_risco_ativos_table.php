<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mapa_risco_ativos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('ticker')->unique();
            $table->string('name');
            $table->string('asset_type')->nullable(); // stock_br | stock_us | etf | fund | commodity | unknown
            $table->json('risk_weights');
            // ex: {"energy": 0.85, "food": 0.1, "fx": 0.35, "military": 0.2}
            $table->json('regions')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            // sem created_at — só updated_at para controle de cache
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mapa_risco_ativos');
    }
};
