<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('planos', function (Blueprint $table) {
            $table->string('product_id_hotmart')->nullable()->unique()->after('role');
            $table->string('product_id_lastlink')->nullable()->unique()->after('product_id_hotmart');
        });
    }

    public function down(): void
    {
        Schema::table('planos', function (Blueprint $table) {
            $table->dropColumn(['product_id_hotmart', 'product_id_lastlink']);
        });
    }
};
