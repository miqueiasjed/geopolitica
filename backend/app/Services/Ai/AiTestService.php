<?php

namespace App\Services\Ai;

class AiTestService
{
    /**
     * Executa um prompt via provider ativo e retorna resultado estruturado.
     * Não salva nada no banco de dados.
     */
    public function executar(string $promptSistema, string $mensagemUsuario, int $maxTokens): array
    {
        $provider = AiProviderFactory::make();

        $nomeProvider = config('ai.provider', 'claude');

        $modelo = match ($nomeProvider) {
            'openai' => (string) config('ai.openai.model', 'gpt-4o'),
            default  => (string) config('claude.model', 'claude-sonnet-4-6'),
        };

        $inicio = microtime(true);

        try {
            $resposta = $provider->complete(
                $promptSistema,
                [['role' => 'user', 'content' => $mensagemUsuario]],
                $maxTokens,
            );
        } catch (\Throwable $e) {
            throw new \RuntimeException($e->getMessage(), 0, $e);
        }

        $fim = microtime(true);

        $duracaoMs = (int) round(($fim - $inicio) * 1000);

        $tokensEstimadosEntrada = (int) (strlen($promptSistema . $mensagemUsuario) / 4);
        $tokensEstimadosSaida   = (int) (strlen($resposta) / 4);

        return [
            'resposta'                 => $resposta,
            'provider'                 => $nomeProvider,
            'modelo'                   => $modelo,
            'duracao_ms'               => $duracaoMs,
            'tokens_estimados_entrada' => $tokensEstimadosEntrada,
            'tokens_estimados_saida'   => $tokensEstimadosSaida,
        ];
    }
}
