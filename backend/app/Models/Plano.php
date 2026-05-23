<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plano extends Model
{
    protected $table = 'planos';

    protected $fillable = [
        'slug',
        'nome',
        'descricao',
        'preco',
        'ordem',
        'ativo',
        'exibir_no_upgrade',
        'lastlink_url',
        'role',
        'product_id_hotmart',
        'product_id_lastlink',
    ];

    protected function casts(): array
    {
        return [
            'ativo'             => 'boolean',
            'exibir_no_upgrade' => 'boolean',
            'preco'             => 'decimal:2',
            'ordem'             => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function recursos(): HasMany
    {
        return $this->hasMany(PlanoRecurso::class, 'plano_id');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeAtivos(Builder $query): Builder
    {
        return $query->where('ativo', true);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function recurso(string $chave): ?PlanoRecurso
    {
        return $this->recursos()->where('chave', $chave)->first();
    }
}
