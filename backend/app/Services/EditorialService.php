<?php

namespace App\Services;

use App\Models\Event;
use App\Services\Ai\AiProviderFactory;

class EditorialService
{
    public function __construct(
        private readonly AiProviderFactory $aiFactory,
    ) {}

    public function gerar(Event $event): array
    {
        $systemPrompt = config('ai.prompts.editorial_sistema');

        $userMessage = $this->buildUserMessage($event);

        $provider = $this->aiFactory->make();

        $resposta = $provider->complete(
            system:    $systemPrompt,
            messages:  [['role' => 'user', 'content' => $userMessage]],
            maxTokens: 4000,
        );

        return $this->parseResposta($resposta);
    }

    private function buildUserMessage(Event $event): string
    {
        $partes = [];

        $partes[] = "TÍTULO: {$event->titulo}";

        if ($event->resumo) {
            $partes[] = "RESUMO: {$event->resumo}";
        }

        if ($event->analise_ia) {
            $partes[] = "ANÁLISE: {$event->analise_ia}";
        }

        if ($event->fonte) {
            $partes[] = "FONTE: {$event->fonte}";
        }

        if ($event->fonte_url) {
            $partes[] = "URL: {$event->fonte_url}";
        }

        if ($event->regiao) {
            $partes[] = "REGIÃO: {$event->regiao}";
        }

        if ($event->publicado_em) {
            $partes[] = "DATA: " . $event->publicado_em->format('d M. y');
        }

        $categorias = $event->categorias ?? [];
        if (! empty($categorias)) {
            $partes[] = "CATEGORIAS: " . implode(', ', $categorias);
        }

        return implode("\n", $partes) . "\n\nGere o editorial seguindo exatamente o formato HEADLINE + LEGENDA.";
    }

    private function parseResposta(string $texto): array
    {
        $headline = '';
        $legenda  = '';

        if (preg_match('/HEADLINE\s*\n(.*?)(?=\nLEGENDA|\z)/si', $texto, $m)) {
            $headline = trim($m[1]);
        }

        if (preg_match('/LEGENDA\s*\n(.*)/si', $texto, $m)) {
            $legenda = trim($m[1]);
        }

        return [
            'headline' => $headline,
            'legenda'  => $legenda,
            'raw'      => $texto,
        ];
    }
}
