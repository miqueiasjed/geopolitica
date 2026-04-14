<?php

namespace App\Mail;

use App\Models\Empresa;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConviteB2BMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $linkConvite;

    public function __construct(
        public Empresa $empresa,
        public string $token,
        public string $roleB2B,
    ) {
        $this->linkConvite = 'https://'
            . $empresa->subdominio . '.'
            . config('app.domain')
            . '/aceitar-convite/' . $token;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Você foi convidado para {$this->empresa->nome} no Geopolítica para Investidores",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.convite-b2b',
        );
    }
}
