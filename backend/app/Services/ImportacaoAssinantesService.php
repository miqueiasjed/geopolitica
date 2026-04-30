<?php

namespace App\Services;

use App\Models\Assinante;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ImportacaoAssinantesService
{
    private const COLUNAS_EMAIL  = ['email', 'e-mail', 'mail', 'e_mail'];
    private const COLUNAS_NOME   = ['name', 'nome', 'full_name', 'full name', 'customer name', 'nome completo', 'customer_name'];
    private const COLUNAS_PLANO  = ['plan', 'plano', 'offer', 'offer_code', 'plan_name', 'product', 'produto', 'plan_id', 'offer_id'];
    private const COLUNAS_STATUS = ['status', 'subscription_status', 'order_status'];
    private const COLUNAS_EXPIRA = ['expires_at', 'expiry_date', 'expira_em', 'data de expiração', 'data_expiracao', 'next_billing', 'valid_until', 'expiration_date', 'access_expiration'];

    public function processarLinha(array $linha, array $cabecalhos): void
    {
        $email = $this->extrairCampo($linha, $cabecalhos, self::COLUNAS_EMAIL);

        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Email inválido ou ausente: " . ($email ?? 'vazio'));
        }

        $planoRaw = $this->extrairCampo($linha, $cabecalhos, self::COLUNAS_PLANO);
        $plano    = $planoRaw ? $this->resolverPlano($planoRaw) : null;

        if (! $plano) {
            throw new \InvalidArgumentException("Plano não identificado para {$email}: '" . ($planoRaw ?? '') . "'");
        }

        $nome      = $this->extrairCampo($linha, $cabecalhos, self::COLUNAS_NOME)
            ?? Str::of($email)->before('@')->replace(['.', '_', '-'], ' ')->title()->value();
        $statusRaw = $this->extrairCampo($linha, $cabecalhos, self::COLUNAS_STATUS);
        $expiraRaw = $this->extrairCampo($linha, $cabecalhos, self::COLUNAS_EXPIRA);
        $status    = $this->normalizarStatus($statusRaw ?? 'ativo');
        $ativo     = $status === 'ativo';

        $usuario = User::firstOrCreate(
            ['email' => $email],
            ['name' => $nome, 'password' => Str::password(24)],
        );

        Assinante::updateOrCreate(
            ['user_id' => $usuario->id],
            [
                'plano'      => $plano,
                'ativo'      => $ativo,
                'status'     => $status,
                'assinado_em' => now(),
                'expira_em'  => $expiraRaw ? $this->parseData($expiraRaw) : null,
            ]
        );

        $this->sincronizarRole($usuario, $plano, $ativo);
    }

    private function extrairCampo(array $linha, array $cabecalhos, array $candidatos): ?string
    {
        foreach ($candidatos as $candidato) {
            $idx = array_search($candidato, $cabecalhos, true);
            if ($idx !== false && isset($linha[$idx]) && trim((string) $linha[$idx]) !== '') {
                return trim((string) $linha[$idx]);
            }
        }

        return null;
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
            in_array($lower, ['ativo', 'active', 'paid', 'aprovado', 'approved', 'complete', 'completed', 'ativa']) => 'ativo',
            in_array($lower, ['cancelado', 'canceled', 'cancelled'])                                                  => 'cancelado',
            in_array($lower, ['expirado', 'expired'])                                                                 => 'expirado',
            in_array($lower, ['reembolsado', 'refunded'])                                                             => 'reembolsado',
            default                                                                                                    => 'ativo',
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
            'pro'       => 'assinante_pro',
            'reservado' => 'assinante_reservado',
            default     => null,
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
}
