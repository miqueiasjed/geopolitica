<?php

namespace App\Services;

use App\Jobs\ImportarAssinantesLastlinkJob;
use App\Mail\BoasVindasMail;
use App\Models\Assinante;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ImportacaoAssinantesService
{
    private const SENHA_PADRAO = '12345678';

    private const CACHE_PREFIXO = 'importacao:lastlink:';

    public function enfileirar(array $dados): array
    {
        $importacaoId = Str::uuid()->toString();
        $linhas = collect($dados['linhas'])
            ->map(fn (array $linha) => $this->normalizarLinha($linha, $dados['plano_padrao'] ?? null))
            ->values()
            ->all();
        $total = count($linhas);
        $ttl = now()->addHours(2);
        $senhaPadrao = $dados['senha_padrao'] ?? self::SENHA_PADRAO;
        $enviarEmail = (bool) ($dados['enviar_email'] ?? true);

        Cache::put($this->cacheKey($importacaoId, 'total'), $total, $ttl);
        Cache::put($this->cacheKey($importacaoId, 'processados'), 0, $ttl);
        Cache::put($this->cacheKey($importacaoId, 'erros_count'), 0, $ttl);
        Cache::put($this->cacheKey($importacaoId, 'erros'), [], $ttl);

        foreach ($linhas as $linha) {
            ImportarAssinantesLastlinkJob::dispatch($linha, $importacaoId, $senhaPadrao, $enviarEmail);
        }

        return [
            'importacao_id' => $importacaoId,
            'total' => $total,
            'message' => "{$total} registros enfileirados para importação.",
        ];
    }

    public function status(string $id): ?array
    {
        $total = (int) Cache::get($this->cacheKey($id, 'total'), 0);

        if ($total === 0) {
            return null;
        }

        $processados = (int) Cache::get($this->cacheKey($id, 'processados'), 0);
        $errosCount = (int) Cache::get($this->cacheKey($id, 'erros_count'), 0);
        $erros = (array) Cache::get($this->cacheKey($id, 'erros'), []);
        $sucesso = $processados - $errosCount;

        return [
            'total' => $total,
            'processados' => $processados,
            'sucesso' => max(0, $sucesso),
            'erros_count' => $errosCount,
            'erros' => $erros,
            'concluido' => $processados >= $total,
            'percentual' => (int) round(($processados / $total) * 100),
        ];
    }

    public function processarLinha(array $linha, string $senhaPadrao = self::SENHA_PADRAO, bool $enviarEmail = true): void
    {
        $linha = $this->normalizarLinha($linha);
        $email = $linha['email'];
        $plano = $linha['plano'];

        if (! $plano) {
            throw new \InvalidArgumentException("Plano não identificado para {$email}.");
        }

        $nome = $linha['nome']
            ?: Str::of($email)->before('@')->replace(['.', '_', '-'], ' ')->title()->value();
        $status = $this->normalizarStatus($linha['status'] ?: 'ativo');
        $ativo = $status === 'ativo';
        $assinadoEm = $linha['assinado_em'] ? $this->parseData($linha['assinado_em']) : now()->toDateString();
        $expiraEm = $linha['expira_em'] ? $this->parseData($linha['expira_em']) : null;

        $usuario = User::firstOrNew(['email' => $email]);

        $usuario->forceFill([
            'name' => $nome,
            'password' => $senhaPadrao,
            'deve_alterar_senha' => true,
        ])->save();

        Assinante::updateOrCreate(
            ['user_id' => $usuario->id],
            [
                'plano' => $plano,
                'ativo' => $ativo,
                'status' => $status,
                'assinado_em' => $assinadoEm,
                'expira_em' => $expiraEm,
            ]
        );

        $this->sincronizarRole($usuario, $plano, $ativo);

        if ($enviarEmail) {
            Mail::to($email)->queue(new BoasVindasMail(
                $usuario,
                $this->montarLinkAcesso(),
                $plano,
                $senhaPadrao,
            ));
        }
    }

    private function normalizarLinha(array $linha, ?string $planoPadrao = null): array
    {
        $email = $this->valor($linha, ['email', 'e-mail', 'mail', 'e_mail', 'e-mail do membro', 'email do membro']);
        $planoRaw = $this->valor($linha, ['plano', 'plan', 'offer', 'offer_code', 'nome da oferta', 'produto principal', 'product', 'produto']);
        $plano = $this->resolverPlano((string) ($linha['plano'] ?? $planoRaw ?? $planoPadrao ?? ''));

        if (! $plano && $planoPadrao) {
            $plano = $planoPadrao;
        }

        return [
            'email' => mb_strtolower(trim((string) $email)),
            'nome' => $this->valor($linha, ['nome', 'name', 'nome/razão social do membro', 'nome/razao social do membro', 'nome completo', 'customer name']) ?? '',
            'plano' => $plano,
            'status' => $this->valor($linha, ['status', 'status da venda', 'subscription_status', 'order_status']) ?? 'ativo',
            'expira_em' => $this->valor($linha, ['expira_em', 'data da expiração', 'data da expiracao', 'data de expiração', 'data_expiracao', 'expires_at', 'valid_until']) ?? null,
            'assinado_em' => $this->valor($linha, ['assinado_em', 'data da venda', 'data de assinatura', 'created_at']) ?? null,
        ];
    }

    private function valor(array $linha, array $chaves): ?string
    {
        $normalizada = [];

        foreach ($linha as $chave => $valor) {
            $normalizada[$this->normalizarChave((string) $chave)] = $valor;
        }

        foreach ($chaves as $chave) {
            $valor = $normalizada[$this->normalizarChave($chave)] ?? null;

            if ($valor !== null && trim((string) $valor) !== '') {
                return trim((string) $valor);
            }
        }

        return null;
    }

    private function normalizarChave(string $chave): string
    {
        return Str::of($chave)->lower()->ascii()->trim()->value();
    }

    private function resolverPlano(string $valor): ?string
    {
        $lower = mb_strtolower(trim($valor));

        if (in_array($lower, ['essencial', 'pro', 'reservado'], true)) {
            return $lower;
        }

        // Offer codes mapeados nas env vars
        $offerMap = config('addons.lastlink_offers', []);
        $upperValor = strtoupper(trim($valor));
        foreach ($offerMap as $code => $plano) {
            if (strtoupper((string) $code) === $upperValor) {
                return $plano;
            }
        }

        // Por palavra-chave no nome
        if (str_contains($lower, 'reservado')) {
            return 'reservado';
        }

        if (preg_match('/\bpro\b/', $lower)) {
            return 'pro';
        }

        if (str_contains($lower, 'essencial') || str_contains($lower, 'essential')) {
            return 'essencial';
        }

        return null;
    }

    private function normalizarStatus(string $status): string
    {
        $lower = mb_strtolower(trim($status));

        return match (true) {
            in_array($lower, ['ativo', 'active', 'paid', 'aprovado', 'aprovada', 'approved', 'complete', 'completed', 'ativa']) => 'ativo',
            in_array($lower, ['cancelado', 'cancelada', 'canceled', 'cancelled']) => 'cancelado',
            in_array($lower, ['expirado', 'expired']) => 'expirado',
            in_array($lower, ['reembolsado', 'refunded']) => 'reembolsado',
            default => 'ativo',
        };
    }

    private function parseData(string $valor): ?string
    {
        try {
            return Carbon::parse($valor)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function sincronizarRole(User $usuario, string $plano, bool $ativo): void
    {
        $roles = ['assinante_essencial', 'assinante_pro', 'assinante_reservado'];

        if (! $ativo) {
            foreach ($roles as $role) {
                if ($usuario->hasRole($role)) {
                    $usuario->removeRole($role);
                }
            }

            return;
        }

        $novaRole = match ($plano) {
            'essencial' => 'assinante_essencial',
            'pro' => 'assinante_pro',
            'reservado' => 'assinante_reservado',
            default => null,
        };

        if (! $novaRole) {
            return;
        }

        foreach ($roles as $role) {
            if ($role !== $novaRole && $usuario->hasRole($role)) {
                $usuario->removeRole($role);
            }
        }

        if (! $usuario->hasRole($novaRole)) {
            $usuario->assignRole($novaRole);
        }
    }

    private function montarLinkAcesso(): string
    {
        return rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/').'/login';
    }

    private function cacheKey(string $importacaoId, string $sufixo): string
    {
        return self::CACHE_PREFIXO.$importacaoId.':'.$sufixo;
    }
}
