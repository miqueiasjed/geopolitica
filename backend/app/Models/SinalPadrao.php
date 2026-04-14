<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SinalPadrao extends Model
{
    protected $table = 'sinais_padrao';

    protected $fillable = [
        'event_id',
        'tipo_padrao',
        'nome_sinal',
        'regiao',
        'peso',
        'confianca',
        'analisado_em',
    ];

    protected function casts(): array
    {
        return [
            'confianca'    => 'float',
            'analisado_em' => 'datetime',
        ];
    }

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function scopeRecentes(Builder $query): Builder
    {
        return $query->where('analisado_em', '>=', now()->subHours(48));
    }

    public function scopePorRegiao(Builder $query, string $regiao): Builder
    {
        return $query->where('regiao', $regiao);
    }
}
