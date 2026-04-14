<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class CriseHistorica extends Model
{
    use HasFactory;

    protected $table = 'crises_historicas';

    protected $fillable = [
        'titulo',
        'slug',
        'ano',
        'data_inicio',
        'data_fim',
        'contexto_geopolitico',
        'impacto_global',
        'impacto_brasil',
        'metricas_globais',
        'metricas_brasil',
        'categorias',
        'content_slug',
    ];

    protected $casts = [
        'data_inicio'      => 'date',
        'data_fim'         => 'date',
        'metricas_globais' => 'array',
        'metricas_brasil'  => 'array',
        'categorias'       => 'array',
    ];

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getEmAndamentoAttribute(): bool
    {
        return $this->data_fim === null;
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopePorCategoria(Builder $query, string $categoria): Builder
    {
        return $query->whereJsonContains('categorias', $categoria);
    }

    public function scopePorPeriodo(Builder $query, int $anoInicio, int $anoFim): Builder
    {
        return $query->whereBetween('ano', [$anoInicio, $anoFim]);
    }
}
