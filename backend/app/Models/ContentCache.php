<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentCache extends Model
{
    protected $table = 'content_cache';

    protected $fillable = [
        'fonte',
        'url',
        'titulo',
        'excerpt',
        'publicado_em',
    ];

    protected function casts(): array
    {
        return [
            'publicado_em' => 'datetime',
        ];
    }
}
