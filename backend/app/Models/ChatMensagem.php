<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMensagem extends Model
{
    protected $table = 'chat_mensagens';

    public $timestamps = false;

    protected $fillable = [
        'sessao_id',
        'role',
        'conteudo',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function sessao(): BelongsTo
    {
        return $this->belongsTo(ChatSessao::class, 'sessao_id');
    }
}
