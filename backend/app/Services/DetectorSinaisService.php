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
        Event::ultimas48h()
            ->whereNotIn('id', SinalPadrao::select('event_id'))
            ->get()
            ->chunk(5)
            ->each(fn (Collection $lote) => $this->analisarLote($lote));
    }

    private function analisarLote(Collection $eventos): void
    {
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

            $sinais = json_decode($texto, true);

            if (! is_array($sinais)) {
                Log::warning('DetectorSinaisService: resposta da IA não é um JSON array válido.', [
                    'resposta' => $texto,
                ]);

                return;
            }

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
            }
        } catch (\Throwable $erro) {
            Log::warning('DetectorSinaisService: falha ao analisar lote de eventos.', [
                'erro'       => $erro->getMessage(),
                'evento_ids' => $eventos->pluck('id')->all(),
            ]);
        }
    }
}
