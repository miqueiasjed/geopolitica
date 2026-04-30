<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuporteAnexoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'nome_original' => $this->nome_original,
            'mime_type'     => $this->mime_type,
            'tamanho'       => $this->tamanho,
            'url'           => $this->url,
        ];
    }
}
