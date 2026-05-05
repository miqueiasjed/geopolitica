<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Indicador extends Model
{
    protected $table = 'indicadores';

    protected $fillable = [
        'simbolo',
        'nome',
        'valor',
        'moeda',
        'unidade',
        'variacao_pct',
        'variacao_abs',
        'atualizado_em',
    ];

    protected function casts(): array
    {
        return [
            'valor'         => 'float',
            'variacao_pct'  => 'float',
            'variacao_abs'  => 'float',
            'atualizado_em' => 'datetime',
        ];
    }

    /**
     * Retorna os indicadores na ordem fixa de exibição.
     */
    public function scopePorOrdem(Builder $query): Builder
    {
        $ordem = ['CL=F', 'BZ=F', 'USDBRL=X', 'NG=F', 'HG=F', 'ALI=F', 'ZW=F', 'ZC=F', 'KC=F'];

        return $query->orderByRaw(
            'FIELD(simbolo, ' . implode(', ', array_fill(0, count($ordem), '?')) . ')',
            $ordem
        );
    }

    public function historico(): HasMany
    {
        return $this->hasMany(IndicadorHistorico::class, 'simbolo', 'simbolo');
    }
}
