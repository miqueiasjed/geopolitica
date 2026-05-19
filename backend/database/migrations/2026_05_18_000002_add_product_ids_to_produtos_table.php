<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->string('product_id_lastlink')->nullable()->unique()->after('chave');
            $table->string('product_id_hotmart')->nullable()->unique()->after('product_id_lastlink');
        });
    }

    public function down(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->dropColumn(['product_id_lastlink', 'product_id_hotmart']);
        });
    }
};
