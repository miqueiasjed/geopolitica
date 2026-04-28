<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Carteira extends Model
{
    protected $table = 'carteiras';

    protected $fillable = [
        'user_id', 'nome', 'ativos', 'ultimo_score',
    ];

    protected function casts(): array
    {
        return [
            'ativos'       => 'array',
            'ultimo_score' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
