<?php

namespace App\Contracts;

interface AiProviderInterface
{
    /**
     * Envia uma mensagem e retorna o texto completo da resposta.
     */
    public function complete(string $system, array $messages, int $maxTokens, float $temperature = 1.0): string;

    /**
     * Envia uma mensagem com streaming, chamando $onToken para cada token recebido.
     * Retorna o texto completo concatenado.
     */
    public function stream(string $system, array $messages, int $maxTokens, callable $onToken): string;
}
