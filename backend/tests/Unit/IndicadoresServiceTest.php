<?php

namespace Tests\Unit;

use App\Models\IndicadorHistorico;
use App\Services\IndicadoresService;
use Database\Seeders\IndicadoresSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IndicadoresServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_upsert_valor_cria_historico_com_created_at(): void
    {
        $this->seed(IndicadoresSeeder::class);

        app(IndicadoresService::class)->upsertValor(
            simbolo: 'BZ=F',
            valor: 113.89,
            variacaoPct: 1.8148,
            variacaoAbs: 2.03,
        );

        $historico = IndicadorHistorico::where('simbolo', 'BZ=F')->firstOrFail();

        $this->assertSame(113.89, (float) $historico->valor);
        $this->assertNotNull($historico->registrado_em);
        $this->assertNotNull($historico->created_at);
    }
}
