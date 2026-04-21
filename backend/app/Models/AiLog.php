<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLog extends Model
{
    public $timestamps = false; // só created_at, gerenciado pela migration

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'provider', 'modelo', 'servico',
        'tokens_entrada', 'tokens_saida', 'custo_estimado_usd',
        'duracao_ms', 'sucesso', 'erro',
    ];

    protected $casts = [
        'sucesso'            => 'boolean',
        'custo_estimado_usd' => 'float',
        'created_at'         => 'datetime',
    ];

    // Preços por provider (USD por 1M tokens)
    private const PRECOS = [
        'claude' => ['entrada' => 3.00,  'saida' => 15.00],
        'openai' => [
            'gpt-4o'      => ['entrada' => 2.50, 'saida' => 10.00],
            'gpt-4o-mini' => ['entrada' => 0.15, 'saida' => 0.60],
        ],
    ];

    public static function calcularCusto(string $provider, string $modelo, int $tokensEntrada, int $tokensSaida): float
    {
        $precos = self::PRECOS[$provider] ?? null;
        if (! $precos) {
            return 0.0;
        }

        if ($provider === 'openai') {
            $precos = $precos[$modelo] ?? $precos['gpt-4o'];
        }

        return round(
            ($tokensEntrada / 1_000_000 * $precos['entrada']) +
            ($tokensSaida  / 1_000_000 * $precos['saida']),
            6
        );
    }
}
