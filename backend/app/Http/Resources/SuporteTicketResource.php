<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuporteTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'assunto'        => $this->assunto,
            'status'         => $this->status,
            'nao_lido_admin' => is_null($this->lido_admin_em),
            'usuario'        => [
                'id'    => $this->user->id,
                'nome'  => $this->user->name,
                'email' => $this->user->email,
            ],
            'mensagens'      => SuporteMensagemResource::collection($this->whenLoaded('mensagens')),
            'total_mensagens' => $this->mensagens_count ?? $this->mensagens->count(),
            'criado_em'      => $this->created_at->toISOString(),
            'atualizado_em'  => $this->updated_at->toISOString(),
        ];
    }
}
