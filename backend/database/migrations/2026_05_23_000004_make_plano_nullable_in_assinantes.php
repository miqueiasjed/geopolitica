<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assinantes', function (Blueprint $table) {
            $table->string('plano')->nullable()->change();
        });

        // Converte strings vazias (workaround do hotfix) para null
        DB::table('assinantes')->where('plano', '')->update(['plano' => null]);
    }

    public function down(): void
    {
        DB::table('assinantes')->whereNull('plano')->update(['plano' => '']);

        Schema::table('assinantes', function (Blueprint $table) {
            $table->string('plano')->nullable(false)->change();
        });
    }
};
