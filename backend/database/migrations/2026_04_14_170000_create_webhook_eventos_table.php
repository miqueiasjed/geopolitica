<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_eventos', function (Blueprint $table) {
            $table->id();
            $table->string('event_type');
            $table->string('hotmart_subscriber_code')->nullable();
            $table->string('email')->nullable();
            $table->json('payload');
            $table->boolean('processado')->default(false);
            $table->timestamp('processado_em')->nullable();
            $table->text('erro')->nullable();
            $table->timestamps();

            $table->index('event_type');
            $table->index('email');
            $table->index(['processado', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_eventos');
    }
};
