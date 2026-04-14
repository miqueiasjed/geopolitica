<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assinante extends Model
{
    protected $table = 'assinantes';

    protected $fillable = [
        'user_id',
        'plano',
        'ativo',
        'status',
        'hotmart_subscriber_code',
        'assinado_em',
        'expira_em',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
            'assinado_em' => 'datetime',
            'expira_em' => 'datetime',
        ];
    }

    public function scopeAtivo($query)
    {
        return $query->where('ativo', true);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
