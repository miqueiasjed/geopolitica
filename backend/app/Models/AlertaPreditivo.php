<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlertaPreditivo extends Model
{
    protected $table = 'alertas_preditivos';

    protected $fillable = [
        'nivel',
        'regiao',
        'titulo',
        'analise',
        'resumo_sinais',
        'peso_total',
        'tipos_padrao',
        'notificado_em',
    ];

    protected function casts(): array
    {
        return [
            'resumo_sinais' => 'array',
            'tipos_padrao'  => 'array',
            'notificado_em' => 'datetime',
        ];
    }

    public function leituras(): HasMany
    {
        return $this->hasMany(AlertaLeitura::class, 'alerta_id');
    }

    public function scopeNaoLidosPor(Builder $query, int $userId): Builder
    {
        return $query->whereNotExists(function ($sub) use ($userId) {
            $sub->select('id')
                ->from('alertas_leituras')
                ->whereColumn('alertas_leituras.alerta_id', 'alertas_preditivos.id')
                ->where('alertas_leituras.user_id', $userId);
        });
    }

    public function scopeVisivelPara(Builder $query, string $nivelPermitido): Builder
    {
        if ($nivelPermitido === 'all') {
            return $query;
        }

        $niveis = array_map('trim', explode(',', $nivelPermitido));

        return $query->whereIn('nivel', $niveis);
    }
}
