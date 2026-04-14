<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembroB2B extends Model
{
    protected $table = 'membros_b2b';

    protected $fillable = [
        'empresa_id',
        'user_id',
        'role_b2b',
        'convite_token',
        'convite_email',
        'aceito_em',
    ];

    protected function casts(): array
    {
        return [
            'aceito_em' => 'datetime',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopePendentes(Builder $query): Builder
    {
        return $query->whereNull('aceito_em');
    }

    public function scopeAtivos(Builder $query): Builder
    {
        return $query->whereNotNull('aceito_em');
    }
}
