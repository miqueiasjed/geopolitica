<?php

namespace App\Services;

use App\Jobs\TrocarPlanoAssinanteJob;
use App\Mail\BoasVindasMail;
use App\Models\Assinante;
use App\Models\Plano;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminAssinanteService
{
    public function trocarPlanoBulk(array $ids, string $novoPlano): array
    {
        $plano = Plano::where('slug', $novoPlano)->first();
        $novaRole = $plano?->role ?? ('assinante_' . $novoPlano);
        $todasRoles = Plano::pluck('role')->filter()->unique()->values()->all();

        $operacaoId = (string) Str::uuid();
        $total = count($ids);

        Cache::put("troca_plano:{$operacaoId}:total", $total, now()->addHours(2));
        Cache::put("troca_plano:{$operacaoId}:processados", 0, now()->addHours(2));
        Cache::put("troca_plano:{$operacaoId}:sucesso", 0, now()->addHours(2));
        Cache::put("troca_plano:{$operacaoId}:erros_count", 0, now()->addHours(2));

        foreach ($ids as $id) {
            TrocarPlanoAssinanteJob::dispatch($id, $novoPlano, $novaRole, $todasRoles, $operacaoId);
        }

        return ['operacao_id' => $operacaoId, 'total' => $total];
    }

    public function statusTrocaPlano(string $operacaoId): array
    {
        $total = (int) Cache::get("troca_plano:{$operacaoId}:total", 0);
        $processados = (int) Cache::get("troca_plano:{$operacaoId}:processados", 0);
        $sucesso = (int) Cache::get("troca_plano:{$operacaoId}:sucesso", 0);
        $errosCount = (int) Cache::get("troca_plano:{$operacaoId}:erros_count", 0);
        $erros = Cache::get("troca_plano:{$operacaoId}:erros", []);
        $concluido = $total > 0 && $processados >= $total;

        return [
            'total'       => $total,
            'processados' => $processados,
            'sucesso'     => $sucesso,
            'erros_count' => $errosCount,
            'erros'       => $erros,
            'concluido'   => $concluido,
            'percentual'  => $total > 0 ? round(($processados / $total) * 100) : 0,
        ];
    }

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
            ->with(['user', 'assinanteAddons' => fn ($q) => $q->where('status', 'ativo')])
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
            ->when(
                $filtros['addon'] ?? null,
                fn ($query, $addon) => $query->whereHas(
                    'assinanteAddons',
                    fn ($q) => $q->where('addon_key', $addon)->where('status', 'ativo')
                )
            )
            ->orderByDesc('assinado_em')
            ->paginate(25)
            ->through(fn (Assinante $assinante) => [
                'id' => $assinante->id,
                'user_id' => $assinante->user_id,
                'email' => $assinante->user?->email,
                'name' => $assinante->user?->name,
                'nome' => $assinante->user?->name,
                'plano' => $assinante->plano,
                'status' => $assinante->status,
                'ativo' => $assinante->ativo,
                'assinado_em' => $assinante->assinado_em?->toIso8601String(),
                'expira_em' => $assinante->expira_em?->toIso8601String(),
                'hotmart_subscriber_code' => $assinante->hotmart_subscriber_code,
                'addons' => $assinante->assinanteAddons->pluck('addon_key')->values()->all(),
            ]);
    }
}
