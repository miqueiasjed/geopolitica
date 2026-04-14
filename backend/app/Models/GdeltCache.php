<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GdeltCache extends Model
{
    use HasFactory;

    protected $table = 'gdelt_cache';

    protected $fillable = [
        'codigo_pais',
        'nome_pais',
        'total_eventos',
        'tom_medio',
        'intensidade_gdelt',
        'atualizado_em',
    ];

    protected function casts(): array
    {
        return [
            'intensidade_gdelt' => 'float',
            'tom_medio'         => 'float',
            'atualizado_em'     => 'datetime',
        ];
    }
}
