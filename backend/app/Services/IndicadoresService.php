<?php

namespace App\Services;

use App\Models\Indicador;
use App\Models\IndicadorHistorico;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class IndicadoresService
{
    private const CHAVE_CACHE   = 'indicadores:lista:v2';
    private const TTL_CACHE_MIN = 15;
    private const DIAS_HISTORICO = 8;

    public function __construct(
        private readonly MarketFetcherService $marketFetcher
    ) {}

    /**
     * Orquestra a busca de dados de mercado, upsert, limpeza de histórico
     * e invalidação de cache Redis.
     */
    public function atualizarTodos(): void
    {
        Log::info('IndicadoresService: iniciando atualização de todos os indicadores.');

        $simbolosYahoo = ['BZ=F', 'NG=F', 'ZS=F', 'ZW=F', 'TIO=F'];

        $cotacoesYahoo = $this->marketFetcher->buscarYahooFinance($simbolosYahoo);
        $cotacaoCambio = $this->marketFetcher->buscarCambioBCB();

        $todasCotacoes = array_merge($cotacoesYahoo, $cotacaoCambio);

        if (empty($todasCotacoes)) {
            Log::warning('IndicadoresService: nenhuma cotação retornada. Atualização abortada.');

            return;
        }

        foreach ($todasCotacoes as $simbolo => $cotacao) {
            $this->upsertValor(
                simbolo:      $simbolo,
                valor:        $cotacao['valor'],
                variacaoPct:  $cotacao['variacao_pct'],
                variacaoAbs:  $cotacao['variacao_abs'],
            );
        }

        $this->limparHistoricoAntigo();

        Cache::forget(self::CHAVE_CACHE);

        Log::info('IndicadoresService: atualização concluída e cache invalidado.', [
            'total_atualizados' => count($todasCotacoes),
        ]);
    }

    /**
     * Atualiza o valor do indicador e insere registro no histórico.
     */
    public function upsertValor(
        string $simbolo,
        float $valor,
        float $variacaoPct,
        float $variacaoAbs
    ): void {
        Indicador::where('simbolo', $simbolo)->update([
            'valor'        => $valor,
            'variacao_pct' => $variacaoPct,
            'variacao_abs' => $variacaoAbs,
            'atualizado_em' => now(),
        ]);

        IndicadorHistorico::create([
            'simbolo'      => $simbolo,
            'valor'        => $valor,
            'registrado_em' => now(),
        ]);
    }

    /**
     * Retorna a lista de indicadores, usando cache Redis com TTL de 15 minutos.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listarComCache(): array
    {
        return Cache::remember(
            self::CHAVE_CACHE,
            now()->addMinutes(self::TTL_CACHE_MIN),
            fn () => Indicador::porOrdem()
                ->get()
                ->map(fn (Indicador $indicador) => [
                    'id'             => $indicador->id,
                    'simbolo'        => $indicador->simbolo,
                    'nome'           => $indicador->nome,
                    'valor'          => $indicador->valor,
                    'moeda'          => $indicador->moeda,
                    'unidade'        => $indicador->unidade,
                    'variacao_pct'   => $indicador->variacao_pct,
                    'variacao_abs'   => $indicador->variacao_abs,
                    'atualizado_em'  => $indicador->atualizado_em?->toISOString(),
                ])
                ->all()
        );
    }

    /**
     * Retorna o histórico dos últimos 7 dias para um símbolo, em ordem ascendente.
     *
     * @return array<int, IndicadorHistorico>
     */
    public function historicoPorSimbolo(string $simbolo): array
    {
        return IndicadorHistorico::where('simbolo', $simbolo)
            ->where('registrado_em', '>=', now()->subDays(7))
            ->orderBy('registrado_em', 'asc')
            ->get()
            ->all();
    }

    /**
     * Remove registros de histórico com mais de 8 dias.
     */
    private function limparHistoricoAntigo(): void
    {
        $removidos = IndicadorHistorico::where('registrado_em', '<', now()->subDays(self::DIAS_HISTORICO))->delete();

        Log::info('IndicadoresService: limpeza de histórico concluída.', [
            'registros_removidos' => $removidos,
        ]);
    }
}
