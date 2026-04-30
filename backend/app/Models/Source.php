<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Source extends Model
{
    protected $fillable = [
        'nome',
        'rss_url',
        'categoria',
        'tier',
        'ativo',
        'ultima_coleta_em',
        'last_successful_fetch',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
            'ultima_coleta_em' => 'datetime',
            'last_successful_fetch' => 'datetime',
        ];
    }

    public function scopeAtivos($query)
    {
        return $query->where('ativo', true);
    }

    public function scopeTier($query, string $tier)
    {
        return $query->where('tier', $tier);
    }
}
