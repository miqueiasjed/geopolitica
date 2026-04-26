<?php

namespace App\Services;

use App\Models\Event;
use App\Models\SinalPadrao;
use App\Services\Ai\AiProviderFactory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class DetectorSinaisService
{
    public function detectar(): void
    {
        $eventos = Event::ultimas48h()
            ->whereNotIn('id', SinalPadrao::select('event_id'))
            ->get();

        Log::channel('pipeline')->info('[DetectorSinais] Eventos encontrados para análise.', [
            'total_eventos_nao_analisados' => $eventos->count(),
        ]);

        if ($eventos->isEmpty()) {
            Log::channel('pipeline')->info('[DetectorSinais] Nenhum evento pendente de detecção de sinais.');

            return;
        }

        $sinaisAntes = SinalPadrao::count();

        $eventos->chunk(5)->each(fn (Collection $lote) => $this->analisarLote($lote));

        $sinaisCriados = SinalPadrao::count() - $sinaisAntes;

        Log::channel('pipeline')->info('[DetectorSinais] Detecção concluída.', [
            'eventos_processados' => $eventos->count(),
            'sinais_criados' => $sinaisCriados,
        ]);
    }

    private function extrairJson(string $texto): string
    {
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $texto, $matches)) {
            return trim($matches[1]);
        }

        return trim($texto);
    }

    private function analisarLote(Collection $eventos): void
    {
        Log::channel('pipeline')->info('[DetectorSinais] Analisando lote via IA.', [
            'event_ids' => $eventos->pluck('id')->all(),
        ]);

        try {
            $dadosEventos = $eventos->map(fn (Event $evento) => [
                'id'         => $evento->id,
                'titulo'     => $evento->titulo,
                'resumo'     => $evento->resumo,
                'regiao'     => $evento->regiao,
                'categorias' => $evento->categorias,
            ])->values()->all();

            $prompt = json_encode([
                'instrucao' => 'Analise os eventos abaixo e devolva somente o JSON array solicitado.',
                'eventos'   => $dadosEventos,
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '[]';

            $texto = AiProviderFactory::make()->complete(
                system:      (string) config('ai.prompts.detector_sistema'),
                messages:    [['role' => 'user', 'content' => $prompt]],
                maxTokens:   1024,
                temperature: 0.0,
            );

            $sinais = json_decode($this->extrairJson($texto), true);

            if (! is_array($sinais)) {
                Log::warning('DetectorSinaisService: resposta da IA não é um JSON array válido.', [
                    'resposta' => $texto,
                ]);
                Log::channel('pipeline')->warning('[DetectorSinais] Resposta da IA inválida (não é JSON array).', [
                    'resposta_bruta' => mb_substr($texto, 0, 300),
                ]);

                return;
            }

            $criados = 0;

            foreach ($sinais as $sinal) {
                if (! is_array($sinal)) {
                    continue;
                }

                $eventId   = $sinal['event_id'] ?? null;
                $tipoPadrao = $sinal['tipo_padrao'] ?? null;
                $nomeSinal  = $sinal['nome_sinal'] ?? null;

                if (! $eventId || ! $tipoPadrao || ! $nomeSinal) {
                    continue;
                }

                SinalPadrao::create([
                    'event_id'    => $eventId,
                    'tipo_padrao' => $tipoPadrao,
                    'nome_sinal'  => $nomeSinal,
                    'regiao'      => $sinal['regiao'] ?? null,
                    'peso'        => $sinal['peso'] ?? 1,
                    'confianca'   => $sinal['confianca'] ?? 0,
                    'analisado_em' => now(),
                ]);

                $criados++;
            }

            Log::channel('pipeline')->info('[DetectorSinais] Sinais criados no lote.', [
                'sinais_na_resposta_ia' => count($sinais),
                'sinais_criados' => $criados,
            ]);
        } catch (\Throwable $erro) {
            Log::warning('DetectorSinaisService: falha ao analisar lote de eventos.', [
                'erro'       => $erro->getMessage(),
                'evento_ids' => $eventos->pluck('id')->all(),
            ]);
            Log::channel('pipeline')->error('[DetectorSinais] ERRO ao analisar lote.', [
                'erro' => $erro->getMessage(),
                'classe_erro' => get_class($erro),
                'evento_ids' => $eventos->pluck('id')->all(),
            ]);
        }
    }
}
