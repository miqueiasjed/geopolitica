<?php

namespace App\Services;

use App\Contracts\AiProviderInterface;
use App\Models\PerfilPais;
use App\Services\Ai\AiProviderFactory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GeradorPerfilPaisService
{
    private const MAX_TOKENS = 500;

    public function gerarPerfil(PerfilPais $pais): PerfilPais
    {
        $provider = AiProviderFactory::make();

        $contextoGeopolitico = $this->gerarContextoGeopolitico($provider, $pais);

        sleep(2);

        $analiseLideranca = $this->gerarAnaliseLideranca($provider, $pais);

        $pais->update([
            'contexto_geopolitico' => $contextoGeopolitico,
            'analise_lideranca'    => $analiseLideranca,
            'gerado_em'            => now(),
        ]);

        Cache::forget("perfil_pais_{$pais->codigo_pais}");
        Cache::forget("perfil_pais_v2_{$pais->codigo_pais}");

        Log::info("Perfil gerado com sucesso para o país: {$pais->nome_pt} ({$pais->codigo_pais})");

        return $pais->fresh();
    }

    private function gerarContextoGeopolitico(AiProviderInterface $provider, PerfilPais $pais): string
    {
        return trim($provider->complete(
            system:    '',
            messages:  [['role' => 'user', 'content' => $this->promptContextoGeopolitico($pais)]],
            maxTokens: self::MAX_TOKENS,
        ));
    }

    private function gerarAnaliseLideranca(AiProviderInterface $provider, PerfilPais $pais): string
    {
        return trim($provider->complete(
            system:    '',
            messages:  [['role' => 'user', 'content' => $this->promptAnaliseLideranca($pais)]],
            maxTokens: self::MAX_TOKENS,
        ));
    }

    private function promptContextoGeopolitico(PerfilPais $pais): string
    {
        $template = (string) config('ai.prompts.perfil_contexto');
        return str_replace('{{pais}}', $pais->nome_pt, $template);
    }

    private function promptAnaliseLideranca(PerfilPais $pais): string
    {
        $template = (string) config('ai.prompts.perfil_lideranca');
        return str_replace('{{pais}}', $pais->nome_pt, $template);
    }
}
