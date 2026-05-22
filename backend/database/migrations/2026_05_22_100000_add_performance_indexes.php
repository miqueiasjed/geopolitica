<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // assinante_addons: suporta ORDER BY iniciado_em DESC por user
        Schema::table('assinante_addons', function (Blueprint $table) {
            $table->index(['user_id', 'iniciado_em'], 'assinante_addons_user_iniciado_idx');
        });

        // events: suporta WHERE relevante + ORDER BY impact_score, publicado_em (WarFeed)
        Schema::table('events', function (Blueprint $table) {
            $table->index(['relevante', 'impact_score', 'publicado_em'], 'events_feed_relevante_idx');
            $table->index('impact_label', 'events_impact_label_idx');
        });
    }

    public function down(): void
    {
        Schema::table('assinante_addons', function (Blueprint $table) {
            $table->dropIndex('assinante_addons_user_iniciado_idx');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_feed_relevante_idx');
            $table->dropIndex('events_impact_label_idx');
        });
    }
};
