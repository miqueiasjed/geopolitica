<?php

namespace Tests\Unit;

use App\Services\AiAnalyzerService;
use Mockery;
use Tests\TestCase;

class AiAnalyzerServiceTest extends TestCase
{
    public function test_sport_news_marked_as_not_relevant(): void
    {
        $service = $this->mockService(json_encode([[
            'relevante' => false,
            'impact_score' => 1,
            'analise_ia' => 'Sem impacto relevante.',
            'regiao' => null,
            'categorias' => [],
        ]], JSON_UNESCAPED_UNICODE));

        $resultado = $service->analisar([[
            'titulo' => 'Time europeu vence final continental',
            'resumo' => 'Cobertura esportiva sem impacto econômico relevante.',
            'fonte_url' => 'https://example.com/esporte',
            'fonte' => 'Teste',
            'publicado_em' => now()->toIso8601String(),
        ]]);

        $this->assertFalse($resultado[0]['relevante']);
        $this->assertSame('MONITORAR', $resultado[0]['impact_label']);
    }

    public function test_sanctions_news_marked_as_relevant_high_score(): void
    {
        $service = $this->mockService(json_encode([[
            'relevante' => true,
            'impact_score' => 8,
            'analise_ia' => 'Sanções ao petróleo podem pressionar energia e câmbio.',
            'regiao' => 'Europa',
            'categorias' => ['energia', 'sancoes'],
        ]], JSON_UNESCAPED_UNICODE));

        $resultado = $service->analisar([[
            'titulo' => 'Novas sanções ao petróleo russo elevam risco global',
            'resumo' => 'Mercado monitora impacto em oferta e fretes.',
            'fonte_url' => 'https://example.com/sancoes',
            'fonte' => 'Teste',
            'publicado_em' => now()->toIso8601String(),
        ]]);

        $this->assertTrue($resultado[0]['relevante']);
        $this->assertGreaterThanOrEqual(6, $resultado[0]['impact_score']);
        $this->assertSame('CRÍTICO', $resultado[0]['impact_label']);
    }

    public function test_invalid_json_response_handled_gracefully(): void
    {
        $service = $this->mockService('nao-e-json');

        $resultado = $service->analisar([[
            'titulo' => 'Item inválido',
            'resumo' => 'Resposta quebrada',
            'fonte_url' => 'https://example.com/invalido',
            'fonte' => 'Teste',
            'publicado_em' => now()->toIso8601String(),
        ]]);

        $this->assertFalse($resultado[0]['relevante']);
        $this->assertSame(1, $resultado[0]['impact_score']);
        $this->assertSame([], $resultado[0]['categorias']);
    }

    private function mockService(string $retorno): AiAnalyzerService
    {
        $service = Mockery::mock(AiAnalyzerService::class)->makePartial();
        $service->shouldAllowMockingProtectedMethods();
        $service->shouldReceive('solicitarAnalise')->andReturn($retorno);

        config(['claude.api_key' => 'teste']);

        return $service;
    }
}
