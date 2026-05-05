<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndicadorHistorico extends Model
{
    protected $table = 'indicadores_historico';

    public const UPDATED_AT = null;

    protected $fillable = [
        'simbolo',
        'valor',
        'registrado_em',
    ];

    protected function casts(): array
    {
        return [
            'registrado_em' => 'datetime',
        ];
    }
}
