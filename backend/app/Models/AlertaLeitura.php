<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertaLeitura extends Model
{
    protected $table = 'alertas_leituras';

    protected $fillable = [
        'user_id',
        'alerta_id',
        'lido_em',
    ];

    protected function casts(): array
    {
        return [
            'lido_em' => 'datetime',
        ];
    }

    public function alerta(): BelongsTo
    {
        return $this->belongsTo(AlertaPreditivo::class, 'alerta_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
