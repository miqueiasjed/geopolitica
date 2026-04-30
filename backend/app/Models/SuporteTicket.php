<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuporteTicket extends Model
{
    protected $fillable = ['user_id', 'assunto', 'status', 'lido_admin_em'];

    protected $casts = [
        'lido_admin_em' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mensagens(): HasMany
    {
        return $this->hasMany(SuporteMensagem::class, 'ticket_id');
    }

    public function ultimaMensagem(): HasMany
    {
        return $this->hasMany(SuporteMensagem::class, 'ticket_id')->latestOfMany();
    }
}
