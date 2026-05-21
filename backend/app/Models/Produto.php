<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produto extends Model
{
    protected $table = 'produtos';

    protected $fillable = [
        'chave',
        'nome',
        'descricao',
        'preco_label',
        'link_compra',
        'link_reativar',
        'ativo',
        'ordem',
        'recurso_plano',
        'product_id_lastlink',
        'product_id_hotmart',
    ];

    protected function casts(): array
    {
        return [
            'ativo'  => 'boolean',
            'ordem'  => 'integer',
        ];
    }

    public function scopeAtivo($query)
    {
        return $query->where('ativo', true);
    }

    public function scopeOrdenado($query)
    {
        return $query->orderBy('ordem')->orderBy('id');
    }
}
