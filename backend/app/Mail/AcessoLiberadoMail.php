<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AcessoLiberadoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $linkAcesso,
        public string $plano,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Seu acesso foi liberado novamente',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.acesso-liberado',
        );
    }
}
