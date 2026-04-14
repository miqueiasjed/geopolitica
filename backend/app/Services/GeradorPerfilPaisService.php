<?php

namespace App\Services;

use Anthropic\Client;
use Anthropic\Messages\TextBlock;
use App\Models\PerfilPais;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GeradorPerfilPaisService
{
    private const MODELO = 'claude-sonnet-4-5';

    private const MAX_TOKENS = 500;

    public function gerarPerfil(PerfilPais $pais): PerfilPais
    {
        $cliente = new Client(apiKey: config('claude.api_key'));

        $contextoGeopolitico = $this->gerarContextoGeopolitico($cliente, $pais);

        sleep(2);

        $analiseLideranca = $this->gerarAnaliseLideranca($cliente, $pais);

        $pais->update([
            'contexto_geopolitico' => $contextoGeopolitico,
            'analise_lideranca'    => $analiseLideranca,
            'gerado_em'            => now(),
        ]);

        Cache::forget("perfil_pais_{$pais->codigo_pais}");

        Log::info("Perfil gerado com sucesso para o país: {$pais->nome_pt} ({$pais->codigo_pais})");

        return $pais->fresh();
    }

    private function gerarContextoGeopolitico(Client $cliente, PerfilPais $pais): string
    {
        $resposta = $cliente->messages->create(
            maxTokens: self::MAX_TOKENS,
            model: self::MODELO,
            messages: [[
                'role'    => 'user',
                'content' => $this->promptContextoGeopolitico($pais),
            ]],
        );

        return $this->extrairTexto($resposta->content);
    }

    private function gerarAnaliseLideranca(Client $cliente, PerfilPais $pais): string
    {
        $resposta = $cliente->messages->create(
            maxTokens: self::MAX_TOKENS,
            model: self::MODELO,
            messages: [[
                'role'    => 'user',
                'content' => $this->promptAnaliseLideranca($pais),
            ]],
        );

        return $this->extrairTexto($resposta->content);
    }

    private function extrairTexto(array $blocos): string
    {
        $texto = collect($blocos)
            ->filter(fn ($bloco) => $bloco instanceof TextBlock)
            ->map(fn (TextBlock $bloco) => $bloco->text)
            ->implode("\n");

        if ($texto === '') {
            throw new \RuntimeException('Resposta vazia da Claude API.');
        }

        return trim($texto);
    }

    private function promptContextoGeopolitico(PerfilPais $pais): string
    {
        return <<<PROMPT
Escreva uma análise geopolítica atual de {$pais->nome_pt} em português com 200 a 300 palavras.
Aborde: posição atual do país na ordem global, suas principais alianças estratégicas, tensões existentes com outros países ou blocos, e impactos relevantes para investidores brasileiros.
Seja objetivo, factual e atual. Não use introduções como "Certamente" ou "Claro".
PROMPT;
    }

    private function promptAnaliseLideranca(PerfilPais $pais): string
    {
        return <<<PROMPT
Escreva uma análise do líder atual de {$pais->nome_pt} em português com 100 a 150 palavras.
Aborde: nome e cargo do líder atual, estilo de governo, posicionamento político, e como suas decisões impactam as relações internacionais do país e os mercados globais.
Seja objetivo e factual. Não use introduções como "Certamente" ou "Claro".
PROMPT;
    }
}
