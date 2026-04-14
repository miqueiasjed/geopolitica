<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Source extends Model
{
    protected $fillable = [
        'nome',
        'rss_url',
        'categoria',
        'ativo',
        'ultima_coleta_em',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
            'ultima_coleta_em' => 'datetime',
        ];
    }

    public function scopeAtivos($query)
    {
        return $query->where('ativo', true);
    }
}
