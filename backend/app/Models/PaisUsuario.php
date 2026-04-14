<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaisUsuario extends Model
{
    protected $table = 'paises_usuarios';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'codigo_pais',
        'adicionado_em',
    ];

    protected function casts(): array
    {
        return [
            'adicionado_em' => 'datetime',
        ];
    }

    public function perfil(): BelongsTo
    {
        return $this->belongsTo(PerfilPais::class, 'codigo_pais', 'codigo_pais');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
