<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuporteMensagemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'corpo'      => $this->corpo,
            'is_admin'   => $this->is_admin,
            'autor_nome' => $this->user->name,
            'criado_em'  => $this->created_at->toISOString(),
            'anexos'     => SuporteAnexoResource::collection($this->whenLoaded('anexos')),
        ];
    }
}
