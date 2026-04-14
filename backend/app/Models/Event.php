<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'titulo',
        'resumo',
        'analise_ia',
        'fonte',
        'fonte_url',
        'regiao',
        'impact_score',
        'impact_label',
        'categorias',
        'relevante',
        'publicado_em',
    ];

    protected function casts(): array
    {
        return [
            'categorias' => 'array',
            'relevante' => 'boolean',
            'publicado_em' => 'datetime',
        ];
    }

    public function scopeRelevantes($query)
    {
        return $query->where('relevante', true);
    }

    public function scopeUltimas48h($query)
    {
        return $query->where('publicado_em', '>=', now()->subHours(48));
    }

    public function scopePorRegiao($query, string $regiao)
    {
        return $query->where('regiao', $regiao);
    }
}
