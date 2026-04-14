<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE OR REPLACE VIEW mapa_intensidade AS
            SELECT
                g.codigo_pais,
                g.nome_pais,
                g.intensidade_gdelt,
                COALESCE(AVG(e.impact_score), 0) AS score_m1,
                ROUND(
                    (COALESCE(AVG(e.impact_score), 0) * 0.6) + (g.intensidade_gdelt * 0.4),
                    2
                ) AS intensidade_final
            FROM gdelt_cache g
            LEFT JOIN events e ON LOWER(e.regiao) LIKE CONCAT('%', LOWER(g.nome_pais), '%')
                AND e.relevante = 1
                AND e.publicado_em >= NOW() - INTERVAL 48 HOUR
            GROUP BY g.codigo_pais, g.nome_pais, g.intensidade_gdelt
        ");
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS mapa_intensidade');
    }
};
