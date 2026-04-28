<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MapaRiscoAtivo extends Model
{
    protected $table = 'mapa_risco_ativos';

    public $timestamps = false;
    public $updatedAt  = 'updated_at';
    public $createdAt  = null;

    protected $fillable = [
        'ticker', 'name', 'asset_type', 'risk_weights', 'regions', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'risk_weights' => 'array',
            'regions'      => 'array',
        ];
    }
}
