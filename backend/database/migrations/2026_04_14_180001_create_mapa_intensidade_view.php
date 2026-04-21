<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('DROP VIEW IF EXISTS mapa_intensidade');

        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement("
                CREATE VIEW mapa_intensidade AS
                SELECT
                    g.codigo_pais,
                    g.nome_pais,
                    g.intensidade_gdelt,
                    COALESCE(AVG(e.impact_score), g.intensidade_gdelt) AS score_m1,
                    ROUND(
                        (COALESCE(AVG(e.impact_score), g.intensidade_gdelt) * 0.6) + (g.intensidade_gdelt * 0.4),
                        2
                    ) AS intensidade_final
                FROM gdelt_cache g
                LEFT JOIN events e ON LOWER(e.regiao) LIKE '%' || LOWER(g.nome_pais) || '%'
                    AND e.relevante = 1
                    AND e.publicado_em >= datetime('now', '-48 hours')
                GROUP BY g.codigo_pais, g.nome_pais, g.intensidade_gdelt
            ");

            return;
        }

        DB::statement("
            CREATE VIEW mapa_intensidade AS
            SELECT
                g.codigo_pais,
                g.nome_pais,
                g.intensidade_gdelt,
                COALESCE(AVG(e.impact_score), g.intensidade_gdelt) AS score_m1,
                ROUND(
                    (COALESCE(AVG(e.impact_score), g.intensidade_gdelt) * 0.6) + (g.intensidade_gdelt * 0.4),
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
