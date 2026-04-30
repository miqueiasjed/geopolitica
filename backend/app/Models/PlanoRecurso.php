<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanoRecurso extends Model
{
    protected $table = 'plano_recursos';

    protected $fillable = [
        'plano_id',
        'chave',
        'valor',
    ];

    protected function casts(): array
    {
        return [];
    }

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function plano(): BelongsTo
    {
        return $this->belongsTo(Plano::class, 'plano_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function valorBoolean(): bool
    {
        return $this->valor === 'true';
    }

    public function valorInteiro(): ?int
    {
        if ($this->valor === null) {
            return null;
        }

        return (int) $this->valor;
    }
}
