<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Eleicao extends Model
{
    protected $table = 'eleicoes';

    protected $fillable = [
        'pais',
        'codigo_pais',
        'data_eleicao',
        'tipo_eleicao',
        'relevancia',
        'contexto_geopolitico',
        'impacto_brasil',
        'candidatos_principais',
        'content_slug',
    ];

    protected $casts = [
        'data_eleicao'         => 'date',
        'candidatos_principais' => 'array',
    ];

    public function scopePorAno(Builder $query, int $ano): Builder
    {
        return $query->whereYear('data_eleicao', $ano);
    }

    public function scopePorRelevancia(Builder $query, string $relevancia): Builder
    {
        return $query->where('relevancia', $relevancia);
    }

    public function scopeOrdenadaPorData(Builder $query): Builder
    {
        return $query->orderBy('data_eleicao', 'ASC');
    }
}
