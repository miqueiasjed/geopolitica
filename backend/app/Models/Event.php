<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'titulo',
        'resumo',
        'analise_ia',
        'headline',
        'legenda',
        'fonte',
        'fonte_url',
        'regiao',
        'impact_score',
        'impact_label',
        'brazil_impact_score',
        'categorias',
        'relevante',
        'publicado_em',
    ];

    protected function casts(): array
    {
        return [
            'categorias' => 'array',
            'relevante' => 'boolean',
            'publicado_em' => 'datetime',
        ];
    }

    public function scopeRelevantes($query)
    {
        return $query->where('relevante', true);
    }

    public function scopeUltimas48h($query)
    {
        return $query->where('publicado_em', '>=', now()->subHours(48));
    }

    public function scopePorRegiao($query, string $regiao)
    {
        return $query->where('regiao', $regiao);
    }

    /**
     * Indica se o evento pertence ao Monitor de Guerra.
     *
     * Mesmo critério aplicado em WarFeedService::buscarFeed: categoria
     * 'military' OU impacto CRÍTICO/ALTO. Usado para rotear o broadcast
     * do Telegram entre o canal de guerra e o canal do feed.
     */
    public function pertenceAoMonitorGuerra(): bool
    {
        $categorias = $this->categorias ?? [];

        return in_array('military', $categorias, true)
            || in_array($this->impact_label, ['CRÍTICO', 'ALTO'], true);
    }
}
