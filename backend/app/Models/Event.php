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
     * Categorias que definem o Monitor de Guerra. Fonte única da verdade
     * usada pelos três consumidores: dashboard/monitor-guerra (WarFeedService),
     * dashboard/feed (FeedConsultaService, que as EXCLUI) e o roteamento do
     * broadcast no Telegram. 'conflitos' é o slug canônico gerado pela IA;
     * 'military' é mantido por compatibilidade com dados legados.
     */
    public const CATEGORIAS_GUERRA = ['conflitos', 'military'];

    /** Eventos do Monitor de Guerra: possuem ao menos uma categoria de guerra. */
    public function scopeMonitorGuerra($query)
    {
        return $query->where(function ($q) {
            foreach (self::CATEGORIAS_GUERRA as $categoria) {
                $q->orWhereJsonContains('categorias', $categoria);
            }
        });
    }

    /** Eventos do feed comum: nenhuma categoria de guerra (exclusivo do monitor). */
    public function scopeForaDoMonitorGuerra($query)
    {
        return $query->where(function ($q) {
            foreach (self::CATEGORIAS_GUERRA as $categoria) {
                $q->whereJsonDoesntContain('categorias', $categoria);
            }
        });
    }

    /**
     * Indica se o evento pertence ao Monitor de Guerra.
     *
     * Critério exclusivo por categoria (militar/conflito): o que está no
     * monitor-guerra NÃO aparece no feed comum, e vice-versa. Usado para
     * rotear o broadcast do Telegram entre o canal de guerra e o do feed.
     */
    public function pertenceAoMonitorGuerra(): bool
    {
        return (bool) array_intersect(self::CATEGORIAS_GUERRA, $this->categorias ?? []);
    }
}
