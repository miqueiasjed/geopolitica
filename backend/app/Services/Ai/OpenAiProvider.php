<?php

namespace App\Services\Ai;

use App\Contracts\AiProviderInterface;
use App\Models\AiLog;
use OpenAI;

class OpenAiProvider implements AiProviderInterface
{
    public function complete(string $system, array $messages, int $maxTokens, float $temperature = 1.0): string
    {
        $inicio        = microtime(true);
        $sucesso       = true;
        $erro          = null;
        $tokensEntrada = 0;
        $tokensSaida   = 0;

        try {
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

            $tokensEntrada = $response->usage->promptTokens     ?? 0;
            $tokensSaida   = $response->usage->completionTokens ?? 0;

            $texto = $response->choices[0]->message->content ?? '';

            if ($texto === '') {
                throw new \RuntimeException('Resposta vazia da OpenAI API.');
            }

            return $texto;
        } catch (\Exception $e) {
            $sucesso = false;
            $erro    = $e->getMessage();
            throw $e;
        } finally {
            $duracaoMs = (int) round((microtime(true) - $inicio) * 1000);
            $modelo    = config('ai.openai.model', 'gpt-4o');
            try {
                AiLog::create([
                    'provider'           => 'openai',
                    'modelo'             => $modelo,
                    'servico'            => 'geral',
                    'tokens_entrada'     => $tokensEntrada,
                    'tokens_saida'       => $tokensSaida,
                    'custo_estimado_usd' => AiLog::calcularCusto('openai', $modelo, $tokensEntrada, $tokensSaida),
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
