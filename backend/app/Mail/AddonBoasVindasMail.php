<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AddonBoasVindasMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nome,
        public string $addonKey,
        public string $linkAcesso,
        public bool $contaNova,
        public string $email = '',
    ) {
    }

    public function build(): self
    {
        $labels     = ['elections' => 'Monitor Eleitoral', 'war' => 'Monitor de Guerra'];
        $addonLabel = $labels[$this->addonKey] ?? $this->addonKey;

        return $this
            ->subject("[GPI] {$addonLabel} ativado")
            ->view('emails.addon-boas-vindas')
            ->with(['addonLabel' => $addonLabel]);
    }
}
