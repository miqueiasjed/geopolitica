<?php

namespace App\Support;

use App\Models\Event;

/**
 * Monta o HTML das mensagens enviadas aos canais do Telegram a partir de um Event.
 *
 * O Telegram aceita parse_mode=HTML com um subconjunto de tags (<b>, <i>, <a>).
 * Todo conteúdo dinâmico precisa ser escapado para não quebrar o parser nem
 * permitir injeção de tags vindas do título/legenda.
 */
class TelegramMessageFormatter
{
    public static function paraEvento(Event $event): string
    {
        $ehGuerra = $event->pertenceAoMonitorGuerra();
        $emoji    = $ehGuerra ? '⚔️' : '🌐';

        $titulo  = $event->headline ?: $event->titulo;
        $corpo   = $event->legenda ?: $event->analise_ia ?: $event->resumo;

        $linhas = [];
        $linhas[] = "{$emoji} <b>" . self::escapar($titulo) . '</b>';

        if (! empty($corpo)) {
            $linhas[] = '';
            $linhas[] = self::escapar($corpo);
        }

        $meta = array_filter([
            $event->regiao ? '📍 ' . self::escapar($event->regiao) : null,
            $event->impact_label ? 'Impacto: ' . self::escapar($event->impact_label) : null,
        ]);

        if (! empty($meta)) {
            $linhas[] = '';
            $linhas[] = implode(' · ', $meta);
        }

        if (! empty($event->fonte_url)) {
            $rotulo = $event->fonte ? self::escapar($event->fonte) : 'Ler na fonte';
            $linhas[] = '🔗 <a href="' . self::escaparAtributo($event->fonte_url) . "\">{$rotulo}</a>";
        }

        return implode("\n", $linhas);
    }

    private static function escapar(string $texto): string
    {
        return htmlspecialchars($texto, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private static function escaparAtributo(string $url): string
    {
        return htmlspecialchars($url, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
