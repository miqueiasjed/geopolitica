<?php

namespace App\Mail;

use App\Models\Assinante;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CancelamentoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Assinante $assinante,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Sua assinatura foi cancelada',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cancelamento',
        );
    }
}
