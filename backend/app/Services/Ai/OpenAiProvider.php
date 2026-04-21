<?php

namespace App\Services\Ai;

use App\Contracts\AiProviderInterface;
use OpenAI;

class OpenAiProvider implements AiProviderInterface
{
    public function complete(string $system, array $messages, int $maxTokens, float $temperature = 1.0): string
    {
        $client = OpenAI::client((string) config('ai.openai.api_key'));

        $allMessages = array_merge(
            [['role' => 'system', 'content' => $system]],
            $messages,
        );

        $response = $client->chat()->create([
            'model'       => config('ai.openai.model', 'gpt-4o'),
            'messages'    => $allMessages,
            'max_tokens'  => $maxTokens,
            'temperature' => $temperature,
        ]);

        $texto = $response->choices[0]->message->content ?? '';

        if ($texto === '') {
            throw new \RuntimeException('Resposta vazia da OpenAI API.');
        }

        return $texto;
    }

    public function stream(string $system, array $messages, int $maxTokens, callable $onToken): string
    {
        $client = OpenAI::client((string) config('ai.openai.api_key'));

        $allMessages = array_merge(
            [['role' => 'system', 'content' => $system]],
            $messages,
        );

        $stream = $client->chat()->createStreamed([
            'model'      => config('ai.openai.model', 'gpt-4o'),
            'messages'   => $allMessages,
            'max_tokens' => $maxTokens,
        ]);

        $resposta = '';

        foreach ($stream as $response) {
            $content = $response->choices[0]->delta->content;
            if ($content !== null) {
                $resposta .= $content;
                $onToken($content);
            }
        }

        return $resposta;
    }
}
