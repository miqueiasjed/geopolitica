<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdfDownload extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'conteudo_id',
        'token',
        'baixado_em',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'baixado_em' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conteudo(): BelongsTo
    {
        return $this->belongsTo(Conteudo::class);
    }
}
