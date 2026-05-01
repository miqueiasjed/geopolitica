<?php

namespace App\Services;

use App\Mail\BoasVindasMail;
use App\Models\Assinante;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Mail;

class AdminAssinanteService
{
    public function reenviarBoasVindas(int $assinanteId): void
    {
        $assinante = Assinante::with('user')->findOrFail($assinanteId);

        $linkAcesso = rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/').'/login';

        Mail::to($assinante->user->email)->send(new BoasVindasMail(
            $assinante->user,
            $linkAcesso,
            $assinante->plano,
            reenvio: true,
        ));
    }

    public function listar(array $filtros): LengthAwarePaginator
    {
        return Assinante::query()
            ->with('user')
            ->when(
                $filtros['search'] ?? null,
                fn ($query, $search) => $query->whereHas(
                    'user',
                    fn ($userQuery) => $userQuery
                        ->where('email', 'like', '%'.$search.'%')
                        ->orWhere('name', 'like', '%'.$search.'%')
                )
            )
            ->when($filtros['plano'] ?? null, fn ($query, $plano) => $query->where('plano', $plano))
            ->when($filtros['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->orderByDesc('assinado_em')
            ->paginate(25)
            ->through(fn (Assinante $assinante) => [
                'id' => $assinante->id,
                'email' => $assinante->user?->email,
                'name' => $assinante->user?->name,
                'nome' => $assinante->user?->name,
                'plano' => $assinante->plano,
                'status' => $assinante->status,
                'ativo' => $assinante->ativo,
                'assinado_em' => $assinante->assinado_em?->toIso8601String(),
                'expira_em' => $assinante->expira_em?->toIso8601String(),
                'hotmart_subscriber_code' => $assinante->hotmart_subscriber_code,
            ]);
    }
}
