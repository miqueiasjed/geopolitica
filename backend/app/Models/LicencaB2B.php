<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LicencaB2B extends Model
{
    protected $table = 'licencas_b2b';

    protected $fillable = [
        'empresa_id',
        'tipo',
        'ativa',
        'contratado_em',
        'expira_em',
    ];

    protected function casts(): array
    {
        return [
            'ativa'         => 'boolean',
            'contratado_em' => 'datetime',
            'expira_em'     => 'datetime',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
