<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class WebhookToken extends Model
{
    protected $table = 'webhook_tokens';

    protected $fillable = [
        'fonte',
        'descricao',
        'token',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
        ];
    }

    public function setTokenAttribute(string $value): void
    {
        $this->attributes['token'] = Crypt::encryptString(trim($value));
    }

    public function getTokenPlainAttribute(): string
    {
        return Crypt::decryptString($this->attributes['token']);
    }
}
