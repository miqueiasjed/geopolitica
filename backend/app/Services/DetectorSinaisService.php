<?php

namespace App\Services;

use Anthropic\Client;
use Anthropic\Messages\TextBlock;
use App\Models\Event;
use App\Models\SinalPadrao;
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

            $cliente = new Client(apiKey: config('claude.api_key'));

            $resposta = $cliente->messages->create(
                maxTokens: 1024,
                model: 'claude-haiku-4-5-20251001',
                system: 'Você é um analista geopolítico. Para cada evento, identifique se há padrão geopolítico (military: ação militar/conflito/mobilização, diplomatic: negociação/acordo/ruptura, supply: crise de abastecimento/commodity). Retorne SOMENTE um JSON array válido. Se evento não tem padrão relevante, omita-o.',
                messages: [['role' => 'user', 'content' => $prompt]],
            );

            $texto = collect($resposta->content)
                ->filter(fn ($bloco) => $bloco instanceof TextBlock)
                ->map(fn (TextBlock $bloco) => $bloco->text)
                ->implode("\n");

            $sinais = json_decode($texto, true);

            if (! is_array($sinais)) {
                Log::warning('DetectorSinaisService: resposta da Claude não é um JSON array válido.', [
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
