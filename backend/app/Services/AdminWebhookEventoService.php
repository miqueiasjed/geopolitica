<?php

namespace App\Services;

use App\Models\WebhookEvento;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminWebhookEventoService
{
    public function excluirEmLote(array $ids): int
    {
        return WebhookEvento::whereIn('id', $ids)->delete();
    }

    public function listar(array $filtros): LengthAwarePaginator
    {
        $processado = match ($filtros['processado'] ?? null) {
            'true', '1' => true,
            'false', '0' => false,
            default => null,
        };

        return WebhookEvento::query()
            ->when($filtros['fonte'] ?? null, fn ($query, $fonte) => $query->where('fonte', $fonte))
            ->when($filtros['type'] ?? null, fn ($query, $tipo) => $query->where('event_type', $tipo))
            ->when($processado !== null, fn ($query) => $query->where('processado', $processado))
            ->latest()
            ->paginate(25)
            ->through(fn (WebhookEvento $evento) => [
                'id' => $evento->id,
                'fonte' => $evento->fonte,
                'event_type' => $evento->event_type,
                'email' => $evento->email,
                'hotmart_subscriber_code' => $evento->hotmart_subscriber_code,
                'processado' => $evento->processado,
                'processado_em' => $evento->processado_em?->toIso8601String(),
                'erro' => $evento->erro,
                'log_acao' => $evento->log_acao,
                'payload' => $evento->payload,
                'created_at' => $evento->created_at?->toIso8601String(),
            ]);
    }
}
