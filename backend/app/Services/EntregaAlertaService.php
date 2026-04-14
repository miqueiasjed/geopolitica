<?php

namespace App\Services;

use App\Mail\AlertaPreditivoMail;
use App\Models\AlertaPreditivo;
use Illuminate\Support\Facades\Mail;

class EntregaAlertaService
{
    public function enviarEmails(AlertaPreditivo $alerta): void
    {
        $usuarios = \App\Models\User::role(['assinante_reservado', 'admin'])->get();

        $usuarios->chunk(50, function ($lote) use ($alerta) {
            foreach ($lote as $usuario) {
                Mail::to($usuario)->send(new AlertaPreditivoMail($alerta));
            }
        });

        $alerta->update(['notificado_em' => now()]);
    }
}
