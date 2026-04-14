<?php

namespace App\Mail;

use App\Models\AlertaPreditivo;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AlertaPreditivoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public AlertaPreditivo $alerta) {}

    public function envelope(): Envelope
    {
        $prefixo = match ($this->alerta->nivel) {
            'critical' => '🚨 Alerta Crítico:',
            'high'     => '⚠️ Alerta Alto:',
            default    => '📊 Alerta:',
        };

        return new Envelope(subject: "$prefixo {$this->alerta->titulo}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.alerta-preditivo');
    }

    public function attachments(): array
    {
        return [];
    }
}
