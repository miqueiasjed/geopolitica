<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Conteudo extends Model
{
    protected $table = 'conteudos';

    protected $fillable = [
        'tipo',
        'titulo',
        'slug',
        'corpo',
        'resumo',
        'regiao',
        'tags',
        'tese_manchete',
        'plano_minimo',
        'publicado',
        'publicado_em',
    ];

    protected function casts(): array
    {
        return [
            'tags'         => 'array',
            'publicado'    => 'boolean',
            'publicado_em' => 'datetime',
        ];
    }

    public function scopePublicados(Builder $query): Builder
    {
        return $query->where('publicado', true)->whereNotNull('publicado_em');
    }

    public function scopeAcessivelPor(Builder $query, string $role): Builder
    {
        return match ($role) {
            'assinante_essencial' => $query
                ->where('plano_minimo', 'essencial')
                ->where('publicado_em', '>=', now()->subDays(90)),

            'assinante_pro' => $query
                ->whereIn('plano_minimo', ['essencial', 'pro'])
                ->where('publicado_em', '>=', now()->subDays(90)),

            'assinante_reservado', 'admin' => $query,

            default => $query->whereRaw('1 = 0'),
        };
    }

    public static function gerarSlug(string $titulo): string
    {
        return Str::slug($titulo) . '-' . now()->timestamp;
    }
}
