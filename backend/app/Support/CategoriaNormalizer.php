<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Normaliza os rótulos de categoria que a IA gera para os eventos do feed.
 *
 * A IA classifica cada notícia livremente e costuma emitir variações
 * ("câmbio" com acento, "forex", "moeda") que não casam com o filtro exato
 * do frontend (whereJsonContains 'cambio'), deixando a aba vazia. A
 * normalização é ADITIVA: o rótulo original é preservado (não quebra outros
 * consumidores, como o WarFeed que busca 'military') e o slug canônico da aba
 * é acrescentado quando reconhecido.
 */
class CategoriaNormalizer
{
    /** Slugs canônicos das abas do feed (mesma lista do FeedFilterRequest). */
    public const CANONICAS = ['energia', 'alimentos', 'cambio', 'conflitos', 'sancoes', 'eleicoes', 'commodities'];

    /** Mapa de rótulo normalizado (sem acento, minúsculo, só letras) → slug canônico. */
    private const SINONIMOS = [
        // câmbio / moeda
        'cambio' => 'cambio', 'cambial' => 'cambio', 'forex' => 'cambio', 'fx' => 'cambio',
        'moeda' => 'cambio', 'moedas' => 'cambio', 'dolar' => 'cambio', 'real' => 'cambio',
        'brl' => 'cambio', 'usd' => 'cambio', 'usdbrl' => 'cambio', 'cotacao' => 'cambio',
        // energia
        'energia' => 'energia', 'petroleo' => 'energia', 'oil' => 'energia', 'gas' => 'energia',
        'brent' => 'energia', 'wti' => 'energia', 'combustivel' => 'energia',
        // alimentos
        'alimentos' => 'alimentos', 'alimento' => 'alimentos', 'food' => 'alimentos',
        'soja' => 'alimentos', 'milho' => 'alimentos', 'trigo' => 'alimentos', 'graos' => 'alimentos',
        // commodities
        'commodities' => 'commodities', 'commodity' => 'commodities',
        // sanções
        'sancoes' => 'sancoes', 'sancao' => 'sancoes', 'sanctions' => 'sancoes', 'embargo' => 'sancoes',
        // eleições
        'eleicoes' => 'eleicoes', 'eleicao' => 'eleicoes', 'election' => 'eleicoes', 'elections' => 'eleicoes',
        // conflitos
        'conflitos' => 'conflitos', 'conflito' => 'conflitos', 'guerra' => 'conflitos',
        'war' => 'conflitos', 'ataque' => 'conflitos', 'militar' => 'conflitos',
    ];

    /**
     * @param  array<int, mixed>  $categorias
     * @return array<int, string>
     */
    public static function normalizar(array $categorias): array
    {
        $resultado = [];

        foreach ($categorias as $bruta) {
            if (! is_string($bruta) || trim($bruta) === '') {
                continue;
            }

            // Preserva o rótulo original (limpo) para não perder dados de outros consumidores.
            $resultado[] = trim($bruta);

            // Remove acentos, baixa caixa e mantém só letras (ex.: "Câmbio" → "cambio").
            $slug = preg_replace('/[^a-z]/', '', mb_strtolower(Str::ascii($bruta))) ?? '';

            if (isset(self::SINONIMOS[$slug])) {
                $resultado[] = self::SINONIMOS[$slug];
            }
        }

        return array_values(array_unique($resultado));
    }
}
