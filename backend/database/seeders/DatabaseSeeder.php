<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesSeeder::class,
            RolesB2BSeeder::class,
            AdminSeeder::class,
            SourcesSeeder::class,
            IndicadoresSeeder::class,
            ConteudoSeeder::class,
            CrisesHistoricasSeeder::class,
            EleicoesSeedSeeder::class,
            PaisesInicialSeeder::class,
            DadosProducaoFakeSeeder::class,
            ConfiguracaoSeeder::class,
            MapaRiscoAtivosSeeder::class,
        ]);
    }
}
