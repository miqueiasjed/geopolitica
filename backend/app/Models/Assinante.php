<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assinante extends Model
{
    protected $table = 'assinantes';

    protected $fillable = [
        'user_id',
        'plano',
        'ativo',
        'status',
        'addons',
        'hotmart_subscriber_code',
        'assinado_em',
        'expira_em',
    ];

    protected function casts(): array
    {
        return [
            'ativo'       => 'boolean',
            'addons'      => 'array',
            'assinado_em' => 'datetime',
            'expira_em'   => 'datetime',
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

    public function assinanteAddons(): HasMany
    {
        return $this->hasMany(AssinanteAddon::class, 'user_id', 'user_id');
    }

    public function temAddon(string $addonKey): bool
    {
        return in_array($addonKey, $this->addons ?? [], true);
    }

    public function getAddonsAttribute($valor): array
    {
        if (is_array($valor)) {
            return $valor;
        }

        $decodificado = json_decode($valor ?? '[]', true);

        return is_array($decodificado) ? $decodificado : [];
    }

}
