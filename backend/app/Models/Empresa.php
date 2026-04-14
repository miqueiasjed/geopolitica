<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Empresa extends Model
{
    protected $fillable = [
        'nome',
        'subdominio',
        'logo_url',
        'ativo',
        'max_usuarios',
        'expira_em',
    ];

    protected function casts(): array
    {
        return [
            'ativo'     => 'boolean',
            'expira_em' => 'datetime',
        ];
    }

    public function membros(): HasMany
    {
        return $this->hasMany(MembroB2B::class);
    }

    public function licenca(): HasOne
    {
        return $this->hasOne(LicencaB2B::class)->latestOfMany();
    }

    public function estaAtiva(): bool
    {
        return $this->ativo && ($this->expira_em === null || $this->expira_em->isFuture());
    }
}
