<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerfilPais extends Model
{
    protected $table = 'perfis_paises';

    protected $primaryKey = 'codigo_pais';

    public $keyType = 'string';

    public $incrementing = false;

    protected $attributes = [
        'indicadores_relevantes' => '[]',
        'termos_busca'           => '[]',
    ];

    protected $fillable = [
        'codigo_pais',
        'nome_pt',
        'bandeira_emoji',
        'regiao_geopolitica',
        'contexto_geopolitico',
        'analise_lideranca',
        'indicadores_relevantes',
        'termos_busca',
        'gerado_em',
    ];

    protected function casts(): array
    {
        return [
            'indicadores_relevantes' => 'array',
            'termos_busca'           => 'array',
            'gerado_em'              => 'datetime',
        ];
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(PaisUsuario::class, 'codigo_pais', 'codigo_pais');
    }

    public function scopePorRegiao($query, string $regiao)
    {
        return $query->where('regiao_geopolitica', $regiao);
    }
}
