<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConteudoCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'tipo'          => $this->tipo,
            'titulo'        => $this->titulo,
            'slug'          => $this->slug,
            'resumo'        => $this->resumo,
            'regiao'        => $this->regiao,
            'tags'          => $this->tags ?? [],
            'tese_manchete'     => $this->tese_manchete,
            'vertical_conteudo' => $this->vertical_conteudo,
            'publicado_em'      => $this->publicado_em?->toIso8601String(),
        ];
    }
}
