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

        Log::channel('pipeline')->info('[Convergencia] Sinais encontrados na janela de análise.', [
            'janela_horas' => $janela,
            'total_sinais' => $sinais->count(),
        ]);

        if ($sinais->isEmpty()) {
            Log::channel('pipeline')->info('[Convergencia] Nenhum sinal na janela — sem alertas para gerar.');

            return;
        }

        $sinaisPorRegiao = $sinais->groupBy('regiao');

        Log::channel('pipeline')->info('[Convergencia] Distribuição de sinais por região.', [
            'regioes' => $sinaisPorRegiao->map(fn ($s) => $s->count())->toArray(),
        ]);

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

        Log::channel('pipeline')->info('[Convergencia] Verificando região.', [
            'regiao' => $regiao,
            'total_sinais' => $sinais->count(),
            'tipos_unicos' => $tiposUnicos->values()->all(),
        ]);

        if ($tiposUnicos->count() < 2) {
            Log::channel('pipeline')->info('[Convergencia] Região sem convergência (menos de 2 tipos distintos).', [
                'regiao' => $regiao,
            ]);

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

        Log::channel('pipeline')->info('[Convergencia] Peso calculado para região.', [
            'regiao' => $regiao,
            'peso_total' => $pesoTotal,
            'nivel_detectado' => $nivel ?? 'abaixo_do_limiar',
            'limiares' => ['critical' => $limiarCritical, 'high' => $limiarHigh, 'medium' => $limiarMedium],
        ]);

        if ($nivel === null) {
            return;
        }

        $jaExiste = AlertaPreditivo::where('regiao', $regiao)
            ->where('created_at', '>=', now()->subHours(48))
            ->exists();

        if ($jaExiste) {
            Log::channel('pipeline')->info('[Convergencia] Alerta já existe nas últimas 48h — ignorando.', [
                'regiao' => $regiao,
                'nivel' => $nivel,
            ]);

            return;
        }

        Log::channel('pipeline')->info('[Convergencia] Gerando novo alerta.', [
            'regiao' => $regiao,
            'nivel' => $nivel,
            'peso_total' => $pesoTotal,
        ]);

        $this->gerarAlerta($regiao, $nivel, $sinais, (int) $pesoTotal);
    }

    private function extrairJson(string $texto): string
    {
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $texto, $matches)) {
            return trim($matches[1]);
        }

        return trim($texto);
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

            $dados = json_decode($this->extrairJson($texto), true);

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
