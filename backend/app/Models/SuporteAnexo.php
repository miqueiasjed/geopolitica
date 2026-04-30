<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class SuporteAnexo extends Model
{
    protected $fillable = ['mensagem_id', 'caminho', 'nome_original', 'mime_type', 'tamanho'];

    public function mensagem(): BelongsTo
    {
        return $this->belongsTo(SuporteMensagem::class, 'mensagem_id');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->caminho);
    }
}
