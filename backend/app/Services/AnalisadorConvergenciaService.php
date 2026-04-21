<?php

namespace App\Services;

use App\Jobs\EnviarEmailAlertaJob;
use App\Models\AlertaPreditivo;
use App\Models\SinalPadrao;
use App\Services\Ai\AiProviderFactory;
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

            $texto = AiProviderFactory::make()->complete(
                system:    (string) config('ai.prompts.convergencia_sistema'),
                messages:  [['role' => 'user', 'content' => $prompt]],
                maxTokens: 512,
            );

            $dados = json_decode($texto, true);

            if (is_array($dados) && isset($dados['titulo'], $dados['analise'])) {
                $titulo  = (string) $dados['titulo'];
                $analise = (string) $dados['analise'];
            }
        } catch (\Throwable $erro) {
            Log::warning('AnalisadorConvergenciaService: falha ao chamar IA API.', [
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
