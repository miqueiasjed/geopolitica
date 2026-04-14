<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndicadorHistorico extends Model
{
    protected $table = 'indicadores_historico';

    public $timestamps = false;

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
