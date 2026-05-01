<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuporteMensagem extends Model
{
    protected $table = 'suporte_mensagens';

    protected $fillable = ['ticket_id', 'user_id', 'corpo', 'is_admin'];

    protected $casts = [
        'is_admin' => 'boolean',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SuporteTicket::class, 'ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function anexos(): HasMany
    {
        return $this->hasMany(SuporteAnexo::class, 'mensagem_id');
    }
}
