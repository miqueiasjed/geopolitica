<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RelatorioIa extends Model
{
    protected $table = 'relatorios_ia';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'user_id', 'title', 'topic', 'scope',
        'body', 'sources_used', 'word_count', 'status',
    ];

    protected function casts(): array
    {
        return [
            'sources_used' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
