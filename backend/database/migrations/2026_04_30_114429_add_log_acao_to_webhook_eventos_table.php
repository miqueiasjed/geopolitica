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
        Schema::table('webhook_eventos', function (Blueprint $table) {
            $table->text('log_acao')->nullable()->after('erro');
        });
    }

    public function down(): void
    {
        Schema::table('webhook_eventos', function (Blueprint $table) {
            $table->dropColumn('log_acao');
        });
    }
};
