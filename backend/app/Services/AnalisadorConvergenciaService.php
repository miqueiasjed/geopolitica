<?php

namespace App\Services;

use Anthropic\Client;
use Anthropic\Messages\TextBlock;
use App\Jobs\EnviarEmailAlertaJob;
use App\Models\AlertaPreditivo;
use App\Models\SinalPadrao;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AnalisadorConvergenciaService
{
    public function analisar(): void
    {
        $janela = (int) config('app.convergencia_janela_horas', 72);

        $sinais = SinalPadrao::where('analisado_em', '>=', now()->subHours($janela))->get();

        if ($sinais->isEmpty()) {
            return;
        }

        $sinaisPorRegiao = $sinais->groupBy('regiao');

        foreach ($sinaisPorRegiao as $regiao => $sinaisDaRegiao) {
            if (! $regiao) {
                continue;
            }

            $this->verificarConvergencia($regiao, $sinaisDaRegiao);
        }
    }

    private function verificarConvergencia(string $regiao, Collection $sinais): void
    {
        $tiposUnicos = $sinais->pluck('tipo_padrao')->unique();

        if ($tiposUnicos->count() < 2) {
            return;
        }

        $pesoTotal = $sinais->sum('peso');

        $limiarCritical = (int) config('app.alerta_threshold_critical', 10);
        $limiarHigh     = (int) config('app.alerta_threshold_high', 7);
        $limiarMedium   = (int) config('app.alerta_threshold_medium', 4);

        $nivel = match (true) {
            $pesoTotal >= $limiarCritical => 'critical',
            $pesoTotal >= $limiarHigh     => 'high',
            $pesoTotal >= $limiarMedium   => 'medium',
            default                       => null,
        };

        if ($nivel === null) {
            return;
        }

        $jaExiste = AlertaPreditivo::where('regiao', $regiao)
            ->where('created_at', '>=', now()->subHours(48))
            ->exists();

        if ($jaExiste) {
            return;
        }

        $this->gerarAlerta($regiao, $nivel, $sinais, (int) $pesoTotal);
    }

    private function gerarAlerta(string $regiao, string $nivel, Collection $sinais, int $pesoTotal): void
    {
        $tiposUnicos = $sinais->pluck('tipo_padrao')->unique();

        $titulo  = "Convergência de Sinais – {$regiao}";
        $analise = $sinais->pluck('nome_sinal')->implode(', ');

        try {
            $dadosSinais = $sinais->map(fn (SinalPadrao $sinal) => [
                'nome_sinal'  => $sinal->nome_sinal,
                'tipo_padrao' => $sinal->tipo_padrao,
                'peso'        => $sinal->peso,
            ])->values()->all();

            $prompt = json_encode([
                'regiao' => $regiao,
                'sinais' => $dadosSinais,
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}';

            $cliente = new Client(apiKey: config('claude.api_key'));

            $resposta = $cliente->messages->create(
                maxTokens: 512,
                model: 'claude-sonnet-4-6',
                system: 'Você é analista geopolítico. Gere uma análise breve sobre convergência de sinais geopolíticos na região indicada. Responda com JSON: {"titulo": "...", "analise": "..."}',
                messages: [['role' => 'user', 'content' => $prompt]],
            );

            $texto = collect($resposta->content)
                ->filter(fn ($bloco) => $bloco instanceof TextBlock)
                ->map(fn (TextBlock $bloco) => $bloco->text)
                ->implode("\n");

            $dados = json_decode($texto, true);

            if (is_array($dados) && isset($dados['titulo'], $dados['analise'])) {
                $titulo  = (string) $dados['titulo'];
                $analise = (string) $dados['analise'];
            }
        } catch (\Throwable $erro) {
            Log::warning('AnalisadorConvergenciaService: falha ao chamar Claude API.', [
                'erro'   => $erro->getMessage(),
                'regiao' => $regiao,
            ]);
        }

        $resumoSinais = $sinais->map(fn (SinalPadrao $sinal) => [
            'titulo' => $sinal->nome_sinal,
            'tipo'   => $sinal->tipo_padrao,
        ])->values()->all();

        $alerta = AlertaPreditivo::create([
            'nivel'        => $nivel,
            'regiao'       => $regiao,
            'titulo'       => $titulo,
            'analise'      => $analise,
            'resumo_sinais' => $resumoSinais,
            'tipos_padrao' => $tiposUnicos->values()->toArray(),
            'peso_total'   => $pesoTotal,
        ]);

        if (in_array($nivel, ['high', 'critical'], true)) {
            EnviarEmailAlertaJob::dispatch($alerta->id);
        }
    }
}
