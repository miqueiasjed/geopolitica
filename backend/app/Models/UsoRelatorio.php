<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsoRelatorio extends Model
{
    protected $table = 'uso_relatorios';

    protected $fillable = ['user_id', 'month_key', 'count'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
