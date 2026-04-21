<?php

namespace App\Services\Ai;

use App\Contracts\AiProviderInterface;

class AiProviderFactory
{
    public static function make(): AiProviderInterface
    {
        return match (config('ai.provider', 'claude')) {
            'openai' => new OpenAiProvider(),
            default  => new ClaudeProvider(),
        };
    }

    public static function hasApiKey(): bool
    {
        return match (config('ai.provider', 'claude')) {
            'openai' => (bool) config('ai.openai.api_key'),
            default  => (bool) config('claude.api_key'),
        };
    }
}
