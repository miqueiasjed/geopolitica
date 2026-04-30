<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedTinyInteger('brazil_impact_score')->default(5)->after('impact_label');
            $table->index(['brazil_impact_score', 'publicado_em'], 'idx_events_brazil_score');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_brazil_score');
            $table->dropColumn('brazil_impact_score');
        });
    }
};
