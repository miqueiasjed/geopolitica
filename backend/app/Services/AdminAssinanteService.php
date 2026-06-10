<?php

namespace App\Services;

use App\Jobs\TrocarPlanoAssinanteJob;
use App\Mail\AddonBoasVindasMail;
use App\Mail\BoasVindasMail;
use App\Models\Assinante;
use App\Models\AssinanteAddon;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminAssinanteService
{
    public function trocarPlanoBulk(array $ids, string $novoPlano): array
    {
        $operacaoId = (string) Str::uuid();
        $total = count($ids);

        Cache::put("troca_plano:{$operacaoId}:total", $total, now()->addHours(2));
        Cache::put("troca_plano:{$operacaoId}:processados", 0, now()->addHours(2));
        Cache::put("troca_plano:{$operacaoId}:sucesso", 0, now()->addHours(2));
        Cache::put("troca_plano:{$operacaoId}:erros_count", 0, now()->addHours(2));

        foreach ($ids as $id) {
            TrocarPlanoAssinanteJob::dispatch($id, $novoPlano, $operacaoId);
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

    public function resetarPrimeiroAcesso(int $assinanteId): void
    {
        $assinante = Assinante::with('user')->findOrFail($assinanteId);

        $this->gerarSenhaEEnviarBoasVindas($assinante);
    }

    public function atualizarAssinante(int $assinanteId, array $dados): Assinante
    {
        $assinante = Assinante::with('user')->findOrFail($assinanteId);

        $atualizacao = [];

        if (array_key_exists('ativo', $dados)) {
            $atualizacao['ativo'] = $dados['ativo'];
        }

        if (array_key_exists('status', $dados)) {
            $atualizacao['status'] = $dados['status'];
        }

        if (array_key_exists('expira_em', $dados)) {
            $atualizacao['expira_em'] = $dados['expira_em'] ?: null;
        }

        $assinante->update($atualizacao);

        return $assinante->refresh();
    }

    public function reenviarBoasVindas(int $assinanteId): void
    {
        $assinante = Assinante::with('user')->findOrFail($assinanteId);

        $this->gerarSenhaEEnviarBoasVindas($assinante);
    }

    /**
     * Gera uma senha aleatória, reseta o acesso do assinante (forçando troca no
     * primeiro login) e envia o e-mail de boas-vindas com essa senha temporária.
     */
    private function gerarSenhaEEnviarBoasVindas(Assinante $assinante): void
    {
        $senha = $this->gerarSenhaAleatoria();

        $assinante->user->update([
            'password'           => Hash::make($senha),
            'deve_alterar_senha' => true,
        ]);

        $linkAcesso = rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/').'/login';

        Mail::to($assinante->user->email)->send(new BoasVindasMail(
            $assinante->user,
            $linkAcesso,
            $assinante->plano ?? 'essencial',
            senhaTemporaria: $senha,
        ));
    }

    private function gerarSenhaAleatoria(): string
    {
        // Sem símbolos para facilitar a digitação; o usuário troca no primeiro acesso.
        return Str::password(10, letters: true, numbers: true, symbols: false);
    }

    public function criarAddonUsuario(array $dados): array
    {
        $usuario = User::firstOrCreate(
            ['email' => $dados['email']],
            [
                'name'               => $dados['nome'],
                'password'           => Hash::make('12345678'),
                'deve_alterar_senha' => true,
            ],
        );

        if (! $usuario->wasRecentlyCreated) {
            throw new \RuntimeException('Já existe um usuário com este e-mail.');
        }

        $usuario->syncRoles(['assinante']);

        $plano = $dados['plano'] ?? null;
        $addonKey = $dados['addon_key'] ?? null;

        Assinante::create([
            'user_id'    => $usuario->id,
            'plano'      => $plano,
            'ativo'      => true,
            'status'     => 'ativo',
            'assinado_em' => now(),
        ]);

        if ($addonKey !== null) {
            AssinanteAddon::create([
                'user_id'     => $usuario->id,
                'addon_key'   => $addonKey,
                'status'      => 'ativo',
                'fonte'       => 'manual',
                'iniciado_em' => now(),
                'expira_em'   => $dados['expira_em'] ?? null,
            ]);
        }

        if ($dados['enviar_email'] ?? true) {
            $linkAcesso = rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/').'/login';

            if ($addonKey !== null) {
                Mail::to($usuario->email)->send(new AddonBoasVindasMail(
                    nome: $usuario->name,
                    addonKey: $addonKey,
                    linkAcesso: $linkAcesso,
                    contaNova: true,
                    email: $usuario->email,
                ));
            } else {
                Mail::to($usuario->email)->send(new BoasVindasMail(
                    user: $usuario,
                    linkAcesso: $linkAcesso,
                    plano: $plano ?? 'essencial',
                ));
            }
        }

        return ['message' => 'Usuário criado com sucesso.', 'user_id' => $usuario->id];
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
