<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssinanteAddon extends Model
{
    public const ADDON_KEYS = ['elections', 'war'];
    public const FONTES = ['hotmart', 'lastlink'];

    protected $table = 'assinante_addons';

    protected $fillable = [
        'user_id',
        'addon_key',
        'status',
        'fonte',
        'order_id',
        'product_id',
        'iniciado_em',
        'expira_em',
    ];

    protected function casts(): array
    {
        return [
            'iniciado_em' => 'datetime',
            'expira_em'   => 'datetime',
        ];
    }

    public function scopeAtivo($query)
    {
        return $query->where('status', 'ativo');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
