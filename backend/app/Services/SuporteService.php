<?php

namespace App\Services;

use App\Models\SuporteAnexo;
use App\Models\SuporteMensagem;
use App\Models\SuporteTicket;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SuporteService
{
    public function abrirTicket(User $user, array $dados): SuporteTicket
    {
        $ticket = SuporteTicket::create([
            'user_id' => $user->id,
            'assunto' => $dados['assunto'],
            'status'  => 'aberto',
        ]);

        $mensagem = SuporteMensagem::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $user->id,
            'corpo'     => $dados['corpo'],
            'is_admin'  => false,
        ]);

        if (! empty($dados['anexos'])) {
            $this->salvarAnexos($mensagem, $dados['anexos'], $ticket->id);
        }

        return $ticket->load('mensagens.anexos', 'mensagens.user', 'user');
    }

    public function responder(SuporteTicket $ticket, User $user, array $dados, bool $isAdmin): SuporteTicket
    {
        $mensagem = SuporteMensagem::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $user->id,
            'corpo'     => $dados['corpo'],
            'is_admin'  => $isAdmin,
        ]);

        if (! empty($dados['anexos'])) {
            $this->salvarAnexos($mensagem, $dados['anexos'], $ticket->id);
        }

        $novoStatus = $isAdmin ? 'respondido' : 'aberto';
        $ticket->update(['status' => $novoStatus]);

        return $ticket->load('mensagens.anexos', 'mensagens.user', 'user');
    }

    public function fecharTicket(SuporteTicket $ticket): SuporteTicket
    {
        $ticket->update(['status' => 'fechado']);

        return $ticket->fresh();
    }

    public function marcarLidoAdmin(SuporteTicket $ticket): void
    {
        if (is_null($ticket->lido_admin_em)) {
            $ticket->update(['lido_admin_em' => now()]);
        }
    }

    private function salvarAnexos(SuporteMensagem $mensagem, array $arquivos, int $ticketId): void
    {
        foreach ($arquivos as $arquivo) {
            if (! $arquivo instanceof UploadedFile) {
                continue;
            }

            $nome    = Str::uuid() . '.' . $arquivo->getClientOriginalExtension();
            $caminho = $arquivo->storeAs("suporte/{$ticketId}", $nome, 'public');

            SuporteAnexo::create([
                'mensagem_id'   => $mensagem->id,
                'caminho'       => $caminho,
                'nome_original' => $arquivo->getClientOriginalName(),
                'mime_type'     => $arquivo->getMimeType(),
                'tamanho'       => $arquivo->getSize(),
            ]);
        }
    }
}
