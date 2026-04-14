<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatSessao extends Model
{
    protected $fillable = [
        'user_id',
        'data_sessao',
        'pergunta_count',
    ];

    protected function casts(): array
    {
        return [
            'data_sessao' => 'date',
        ];
    }

    public function mensagens(): HasMany
    {
        return $this->hasMany(ChatMensagem::class, 'sessao_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeHoje(Builder $query): Builder
    {
        return $query->whereDate('data_sessao', today());
    }

    public static function obterOuCriarHoje(int $userId): self
    {
        return static::firstOrCreate([
            'user_id'    => $userId,
            'data_sessao' => today(),
        ]);
    }
}
