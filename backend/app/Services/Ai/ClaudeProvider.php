<?php

namespace App\Services\Ai;

use Anthropic\Client;
use Anthropic\Messages\RawContentBlockDeltaEvent;
use Anthropic\Messages\TextBlock;
use Anthropic\Messages\TextDelta;
use App\Contracts\AiProviderInterface;
use App\Models\AiLog;

class ClaudeProvider implements AiProviderInterface
{
    public function complete(string $system, array $messages, int $maxTokens, float $temperature = 1.0): string
    {
        $inicio        = microtime(true);
        $sucesso       = true;
        $erro          = null;
        $tokensEntrada = 0;
        $tokensSaida   = 0;

        try {
            $cliente = new Client(apiKey: config('claude.api_key'));

            $resposta = $cliente->messages->create(
                maxTokens:   $maxTokens,
                model:       config('claude.model', 'claude-sonnet-4-6'),
                system:      $system,
                messages:    $messages,
                temperature: $temperature,
            );

            $tokensEntrada = $resposta->usage->inputTokens  ?? 0;
            $tokensSaida   = $resposta->usage->outputTokens ?? 0;

            $texto = collect($resposta->content)
                ->filter(fn ($block) => $block instanceof TextBlock)
                ->map(fn (TextBlock $block) => $block->text)
                ->implode("\n");

            if ($texto === '') {
                throw new \RuntimeException('Resposta vazia da Claude API.');
            }

            return $texto;
        } catch (\Exception $e) {
            $sucesso = false;
            $erro    = $e->getMessage();
            throw $e;
        } finally {
            $duracaoMs = (int) round((microtime(true) - $inicio) * 1000);
            $modelo    = config('claude.model', 'claude-sonnet-4-6');
            try {
                AiLog::create([
                    'provider'           => 'claude',
                    'modelo'             => $modelo,
                    'servico'            => 'geral',
                    'tokens_entrada'     => $tokensEntrada,
                    'tokens_saida'       => $tokensSaida,
                    'custo_estimado_usd' => AiLog::calcularCusto('claude', $modelo, $tokensEntrada, $tokensSaida),
                    'duracao_ms'         => $duracaoMs,
                    'sucesso'            => $sucesso,
                    'erro'               => $erro,
                ]);
            } catch (\Exception) {
                // fire-and-forget: falha silenciosa de log
            }
        }
    }

    public function stream(string $system, array $messages, int $maxTokens, callable $onToken): string
    {
        $cliente = new Client(apiKey: config('claude.api_key'));

        $stream = $cliente->messages->createStream(
            maxTokens: $maxTokens,
            messages:  $messages,
            model:     config('claude.model', 'claude-sonnet-4-6'),
            system:    $system,
        );

        $resposta = '';

        foreach ($stream as $evento) {
            if (
                $evento instanceof RawContentBlockDeltaEvent &&
                $evento->delta instanceof TextDelta
            ) {
                $token     = $evento->delta->text;
                $resposta .= $token;
                $onToken($token);
            }
        }

        return $resposta;
    }
}
