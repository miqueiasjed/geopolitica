<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'resumo' => $this->resumo,
            'analise_ia' => $this->analise_ia,
            'headline' => $this->headline,
            'legenda' => $this->legenda,
            'fonte' => $this->fonte,
            'fonte_url' => $this->fonte_url,
            'regiao' => $this->regiao,
            'impact_score' => $this->impact_score,
            'impact_label' => $this->impact_label,
            'categorias' => $this->categorias ?? [],
            'publicado_em' => $this->publicado_em?->toIso8601String(),
        ];
    }
}
