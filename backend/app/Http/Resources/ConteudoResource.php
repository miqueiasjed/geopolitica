<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConteudoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'tipo'             => $this->tipo,
            'edicao'           => $this->edicao,
            'autor'            => $this->autor,
            'titulo'           => $this->titulo,
            'slug'             => $this->slug,
            'corpo'            => $this->corpo,
            'resumo'           => $this->resumo,
            'regiao'           => $this->regiao,
            'tags'             => $this->tags ?? [],
            'tese_manchete'    => $this->tese_manchete,
            'plano_minimo'     => $this->plano_minimo,
            'status'           => $this->publicado ? 'publicado' : 'rascunho',
            'publicado_em'     => $this->publicado_em?->toIso8601String(),
            'vertical_conteudo' => $this->vertical_conteudo,
        ];
    }
}
