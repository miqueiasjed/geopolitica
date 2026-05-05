<?php

namespace App\Console\Commands;

use App\Services\AlphaVantageService;
use App\Services\IndicadoresService;
use Illuminate\Console\Command;

class TestarIndicadoresCommand extends Command
{
    protected $signature = 'indicadores:testar {--limpar-cache : Limpa os caches do Alpha Vantage antes de testar}';
    protected $description = 'Testa a conexão com o Alpha Vantage e exibe as cotações retornadas.';

    public function handle(
        AlphaVantageService $alpha,
        IndicadoresService $indicadoresService
    ): int {
        $apiKey = config('services.alphavantage.api_key', '');

        if (empty($apiKey)) {
            $this->error('API Key do Alpha Vantage não configurada. Vá em Admin → Configurações → Mercado & Cotações.');

            return self::FAILURE;
        }

        if ($this->option('limpar-cache')) {
            $simbolos = ['CL=F', 'BZ=F', 'NG=F', 'HG=F', 'ALI=F', 'ZW=F', 'ZC=F', 'KC=F'];
            foreach ($simbolos as $s) {
                \Illuminate\Support\Facades\Cache::forget("alpha:cotacao:{$s}");
                \Illuminate\Support\Facades\Cache::forget("alpha:historico:{$s}");
            }
            \Illuminate\Support\Facades\Cache::forget('alpha:cotacao:forexUSDBRL');
            \Illuminate\Support\Facades\Cache::forget('alpha:historico:forexUSDBRL');
            \Illuminate\Support\Facades\Cache::forget('indicadores:lista:v2');
            $this->line('Cache limpo.');
        }

        $this->info('API Key encontrada. Testando conexão com o Alpha Vantage...');
        $this->newLine();

        $simbolos = ['CL=F', 'BZ=F', 'NG=F', 'HG=F', 'ALI=F', 'ZW=F', 'ZC=F', 'KC=F'];
        $cotacoes = $alpha->buscarCotacoes($simbolos);

        if (empty($cotacoes)) {
            $this->error('Nenhuma cotação retornada. Verifique se a chave está correta e o plano ativo.');

            return self::FAILURE;
        }

        $this->table(
            ['Símbolo', 'Valor', 'Variação %', 'Variação Abs'],
            collect($cotacoes)->map(fn ($c, $s) => [
                $s,
                number_format($c['valor'], 4),
                number_format($c['variacao_pct'], 4) . '%',
                number_format($c['variacao_abs'], 4),
            ])->values()->all()
        );

        $faltando = array_values(array_diff($simbolos, array_keys($cotacoes)));
        if (! empty($faltando)) {
            $this->warn('Sem dados retornados para: ' . implode(', ', $faltando));
        }

        $this->newLine();
        $this->info('Testando câmbio USD/BRL...');

        $cambio = $alpha->buscarCambio('USD', 'BRL');

        if ($cambio === null) {
            $this->warn('Câmbio USD/BRL não retornou dados.');
        } else {
            $this->table(
                ['Par', 'Valor', 'Variação %', 'Variação Abs'],
                [['USD/BRL', number_format($cambio['valor'], 4), number_format($cambio['variacao_pct'], 4) . '%', number_format($cambio['variacao_abs'], 4)]]
            );
        }

        $this->newLine();
        $this->info('Atualizando indicadores no banco...');
        $indicadoresService->atualizarTodos();
        $this->info('Feito! Os indicadores foram salvos e o cache invalidado.');

        return self::SUCCESS;
    }
}
