<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Automacao extends Model
{
    protected $table = 'automacoes';

    protected $fillable = [
        'chave',
        'grupo',
        'label',
        'descricao',
        'ativa',
    ];

    protected $casts = [
        'ativa' => 'boolean',
    ];

    public const CACHE_KEY = 'automacoes:mapa';

    /**
     * Verifica se uma automação está ligada. Cacheado em memória persistente
     * porque é consultado pelo schedule:run a cada minuto. Em caso de falha
     * (ex.: tabela ainda não migrada) ou chave inexistente, assume ligada para
     * nunca interromper o comportamento padrão do sistema.
     */
    public static function estaAtiva(string $chave): bool
    {
        try {
            $mapa = Cache::rememberForever(
                self::CACHE_KEY,
                fn () => static::query()->pluck('ativa', 'chave')->all()
            );
        } catch (\Throwable) {
            return true;
        }

        return (bool) ($mapa[$chave] ?? true);
    }

    public static function limparCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
