<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alertas_preditivos', function (Blueprint $table) {
            $table->unsignedBigInteger('evento_id')->nullable()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('alertas_preditivos', function (Blueprint $table) {
            $table->dropColumn('evento_id');
        });
    }
};
