<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvento extends Model
{
    protected $table = 'webhook_eventos';

    protected $fillable = [
        'fonte',
        'event_type',
        'hotmart_subscriber_code',
        'email',
        'payload',
        'processado',
        'processado_em',
        'erro',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processado' => 'boolean',
            'processado_em' => 'datetime',
        ];
    }

    public function scopePendentes($query)
    {
        return $query->where('processado', false);
    }

    public function scopePorTipo($query, string $tipo)
    {
        return $query->where('event_type', $tipo);
    }
}
