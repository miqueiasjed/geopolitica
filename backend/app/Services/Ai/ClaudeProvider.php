<?php

namespace App\Services\Ai;

use Anthropic\Client;
use Anthropic\Messages\RawContentBlockDeltaEvent;
use Anthropic\Messages\TextBlock;
use Anthropic\Messages\TextDelta;
use App\Contracts\AiProviderInterface;

class ClaudeProvider implements AiProviderInterface
{
    public function complete(string $system, array $messages, int $maxTokens, float $temperature = 1.0): string
    {
        $cliente = new Client(apiKey: config('claude.api_key'));

        $resposta = $cliente->messages->create(
            maxTokens:   $maxTokens,
            model:       config('claude.model', 'claude-sonnet-4-6'),
            system:      $system,
            messages:    $messages,
            temperature: $temperature,
        );

        $texto = collect($resposta->content)
            ->filter(fn ($block) => $block instanceof TextBlock)
            ->map(fn (TextBlock $block) => $block->text)
            ->implode("\n");

        if ($texto === '') {
            throw new \RuntimeException('Resposta vazia da Claude API.');
        }

        return $texto;
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
