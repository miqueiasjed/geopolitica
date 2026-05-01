<?php

namespace App\Services;

use App\Mail\AcessoLiberadoMail;
use App\Mail\BoasVindasMail;
use App\Mail\CancelamentoMail;
use App\Mail\ReembolsoMail;
use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookEvento;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;

class HotmartHandlerService
{
    private const ROLES_ASSINANTE = [
        'assinante_essencial',
        'assinante_pro',
        'assinante_reservado',
    ];

    public function registrarEvento(array $payload): WebhookEvento
    {
        return WebhookEvento::query()->create([
            'event_type' => $this->extrairValor($payload, [
                'event',
                'event_type',
            ]) ?? 'desconhecido',
            'hotmart_subscriber_code' => $this->extrairCodigoAssinante($payload),
            'email' => $this->extrairEmail($payload),
            'payload' => $payload,
        ]);
    }

    public function handle(WebhookEvento $evento): void
    {
        try {
            match ($evento->event_type) {
                'PURCHASE_APPROVED' => $this->handlePurchaseApproved($evento->payload),
                'PURCHASE_COMPLETE' => $this->handlePurchaseComplete($evento->payload),
                'PURCHASE_CANCELED' => $this->handlePurchaseCanceled($evento->payload),
                'PURCHASE_REFUNDED' => $this->handlePurchaseRefunded($evento->payload),
                'PURCHASE_CHARGEBACK' => $this->handlePurchaseChargeback($evento->payload),
                'PURCHASE_EXPIRED' => $this->handlePurchaseExpired($evento->payload),
                'SWITCH_PLAN' => $this->handleSwitchPlan($evento->payload),
                default => null,
            };

            $evento->forceFill([
                'processado' => true,
                'processado_em' => now(),
                'erro' => null,
            ])->save();
        } catch (\Throwable $throwable) {
            $evento->forceFill([
                'erro' => $throwable->getMessage()."\n".$throwable->getTraceAsString(),
            ])->save();
        }
    }

    private function handlePurchaseApproved(array $payload): void
    {
        $tipo = $this->resolverTipoCompra($payload);

        if ($tipo['tipo'] === 'addon') {
            $this->ativarAddon($payload, $tipo['addon_key']);

            return;
        }

        $this->ativarAssinatura($payload, enviarBoasVindas: true);
    }

    private function handlePurchaseComplete(array $payload): void
    {
        $tipo = $this->resolverTipoCompra($payload);

        if ($tipo['tipo'] === 'addon') {
            $this->ativarAddon($payload, $tipo['addon_key']);

            return;
        }

        $this->ativarAssinatura($payload, enviarBoasVindas: true);
    }

    private function handlePurchaseCanceled(array $payload): void
    {
        $tipo = $this->resolverTipoCompra($payload);

        if ($tipo['tipo'] === 'addon') {
            $this->cancelarAddon($payload, $tipo['addon_key'], 'cancelado');

            return;
        }

        $this->desativarAssinatura($payload, 'cancelado', enviarReembolso: false);
    }

    private function handlePurchaseRefunded(array $payload): void
    {
        $tipo = $this->resolverTipoCompra($payload);

        if ($tipo['tipo'] === 'addon') {
            $this->cancelarAddon($payload, $tipo['addon_key'], 'reembolsado');

            return;
        }

        $this->desativarAssinatura($payload, 'reembolsado', enviarReembolso: true);
    }

    private function handlePurchaseChargeback(array $payload): void
    {
        $tipo = $this->resolverTipoCompra($payload);

        if ($tipo['tipo'] === 'addon') {
            $this->cancelarAddon($payload, $tipo['addon_key'], 'cancelado');

            return;
        }

        $this->desativarAssinatura($payload, 'chargeback', enviarReembolso: false);
    }

    private function handlePurchaseExpired(array $payload): void
    {
        $tipo = $this->resolverTipoCompra($payload);

        if ($tipo['tipo'] === 'addon') {
            $this->cancelarAddon($payload, $tipo['addon_key'], 'expirado');

            return;
        }

        $this->desativarAssinatura($payload, 'expirado', enviarReembolso: false);
    }

    private function handleSwitchPlan(array $payload): void
    {
        [$usuario, $assinante] = $this->localizarAssinante($payload);
        $plano = $this->normalizarPlano($payload);

        $assinante->forceFill([
            'plano' => $plano,
            'ativo' => true,
            'status' => 'ativo',
            'hotmart_subscriber_code' => $this->extrairCodigoAssinante($payload),
            'assinado_em' => $this->extrairData($payload, ['subscription.approved_date', 'purchase.approved_date']) ?? $assinante->assinado_em,
            'expira_em' => $this->extrairData($payload, ['subscription.access_date', 'subscription.next_billing_date']),
        ])->save();

        $this->sincronizarRolePlano($usuario, $plano);

        if (! $assinante->getOriginal('ativo')) {
            Mail::to($usuario->email)->send(new AcessoLiberadoMail(
                $usuario,
                $this->montarLinkAcesso(),
                $plano,
            ));
        }
    }

    private function resolverTipoCompra(array $payload): array
    {
        $productId = $this->extrairValor($payload, [
            'data.purchase.product.id',
            'data.product.id',
            'purchase.product.id',
            'product.id',
        ]);

        if ($productId) {
            $addonKey = AddonService::resolverAddonKey($productId, 'hotmart');

            if ($addonKey !== null) {
                return ['tipo' => 'addon', 'addon_key' => $addonKey];
            }
        }

        return ['tipo' => 'plano'];
    }

    private function ativarAddon(array $payload, string $addonKey): void
    {
        $email = $this->extrairEmail($payload);

        if (! $email) {
            throw new RuntimeException('Nao foi possivel identificar o e-mail do comprador no payload Hotmart.');
        }

        $usuario = User::query()->where('email', $email)->firstOrFail();

        $orderId = $this->extrairValor($payload, [
            'data.purchase.order_date',
            'data.purchase.transaction',
            'purchase.transaction',
        ]);

        $productId = $this->extrairValor($payload, [
            'data.purchase.product.id',
            'data.product.id',
            'purchase.product.id',
            'product.id',
        ]);

        (new AddonService())->ativar($usuario->id, $addonKey, 'hotmart', $orderId, $productId);
    }

    private function cancelarAddon(array $payload, string $addonKey, string $motivo): void
    {
        $email = $this->extrairEmail($payload);

        if (! $email) {
            throw new RuntimeException('Nao foi possivel identificar o e-mail do comprador no payload Hotmart.');
        }

        $usuario = User::query()->where('email', $email)->firstOrFail();

        (new AddonService())->cancelar($usuario->id, $addonKey, $motivo);
    }

    private function ativarAssinatura(array $payload, bool $enviarBoasVindas): void
    {
        $email = $this->extrairEmail($payload);

        if (! $email) {
            throw new RuntimeException('Nao foi possivel identificar o e-mail do comprador no payload Hotmart.');
        }

        $nome = $this->extrairNome($payload) ?? Str::of($email)->before('@')->replace(['.', '_', '-'], ' ')->title()->value();
        $usuario = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name'               => $nome,
                'password'           => '12345678',
                'deve_alterar_senha' => true,
            ],
        );

        $plano = $this->normalizarPlano($payload);

        $assinante = Assinante::query()->firstOrNew([
            'user_id' => $usuario->id,
        ]);

        $eraNovo = ! $assinante->exists;
        $estavaAtivo = (bool) $assinante->ativo;

        $assinante->fill([
            'plano' => $plano,
            'ativo' => true,
            'status' => 'ativo',
            'hotmart_subscriber_code' => $this->extrairCodigoAssinante($payload),
            'assinado_em' => $this->extrairData($payload, ['subscription.approved_date', 'purchase.approved_date', 'purchase.order_date']) ?? now(),
            'expira_em' => $this->extrairData($payload, ['subscription.access_date', 'subscription.next_billing_date']),
        ]);
        $assinante->save();

        $this->sincronizarRolePlano($usuario, $plano);

        if ($enviarBoasVindas && ($usuario->wasRecentlyCreated || $eraNovo)) {
            Mail::to($usuario->email)->send(new BoasVindasMail(
                $usuario,
                $this->montarLinkAcesso(),
                $plano,
            ));

            return;
        }

        if (! $estavaAtivo) {
            Mail::to($usuario->email)->send(new AcessoLiberadoMail(
                $usuario,
                $this->montarLinkAcesso(),
                $plano,
            ));
        }
    }

    private function desativarAssinatura(array $payload, string $status, bool $enviarReembolso): void
    {
        [$usuario, $assinante] = $this->localizarAssinante($payload);

        $assinante->forceFill([
            'ativo' => false,
            'status' => $status,
            'expira_em' => $this->extrairData($payload, ['subscription.access_date', 'purchase.access_until']) ?? $assinante->expira_em,
        ])->save();

        foreach (self::ROLES_ASSINANTE as $role) {
            if ($usuario->hasRole($role)) {
                $usuario->removeRole($role);
            }
        }

        if ($enviarReembolso) {
            Mail::to($usuario->email)->send(new ReembolsoMail($usuario, $assinante));

            return;
        }

        Mail::to($usuario->email)->send(new CancelamentoMail($usuario, $assinante));
    }

    private function localizarAssinante(array $payload): array
    {
        $codigo = $this->extrairCodigoAssinante($payload);
        $email = $this->extrairEmail($payload);

        $assinante = Assinante::query()
            ->with('user')
            ->when($codigo, fn ($query) => $query->where('hotmart_subscriber_code', $codigo))
            ->when($email, fn ($query) => $query->orWhereHas('user', fn ($userQuery) => $userQuery->where('email', $email)))
            ->first();

        if (! $assinante || ! $assinante->user) {
            throw new RuntimeException('Assinante nao encontrado para o evento Hotmart.');
        }

        return [$assinante->user, $assinante];
    }

    private function sincronizarRolePlano(User $usuario, string $plano): void
    {
        $novaRole = match ($plano) {
            'essencial' => 'assinante_essencial',
            'pro' => 'assinante_pro',
            'reservado' => 'assinante_reservado',
            default => throw new RuntimeException('Plano Hotmart nao suportado: '.$plano),
        };

        foreach (self::ROLES_ASSINANTE as $role) {
            if ($role !== $novaRole && $usuario->hasRole($role)) {
                $usuario->removeRole($role);
            }
        }

        if (! $usuario->hasRole($novaRole)) {
            $usuario->assignRole($novaRole);
        }
    }

    private function normalizarPlano(array $payload): string
    {
        $valor = Str::of((string) ($this->extrairValor($payload, [
            'data.product.name',
            'product.name',
            'data.subscription.plan.name',
            'subscription.plan.name',
            'data.plan.name',
            'plan.name',
            'data.product.id',
            'product.id',
        ]) ?? ''))->lower()->ascii()->value();

        return match (true) {
            str_contains($valor, 'reservado') => 'reservado',
            str_contains($valor, 'essencial'), str_contains($valor, 'essential') => 'essencial',
            default => 'pro',
        };
    }

    private function montarLinkAcesso(): string
    {
        return rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/').'/login';
    }

    private function extrairNome(array $payload): ?string
    {
        return $this->extrairValor($payload, [
            'data.buyer.name',
            'buyer.name',
            'data.subscriber.name',
            'subscriber.name',
        ]);
    }

    private function extrairEmail(array $payload): ?string
    {
        return $this->extrairValor($payload, [
            'data.buyer.email',
            'buyer.email',
            'data.subscriber.email',
            'subscriber.email',
        ]);
    }

    private function extrairCodigoAssinante(array $payload): ?string
    {
        return $this->extrairValor($payload, [
            'data.subscriber.code',
            'subscriber.code',
            'data.subscription.subscriber_code',
            'subscription.subscriber_code',
        ]);
    }

    private function extrairData(array $payload, array $caminhos): ?CarbonImmutable
    {
        $valor = $this->extrairValor($payload, $caminhos);

        if (! $valor) {
            return null;
        }

        return CarbonImmutable::parse($valor)->setTimezone(config('app.timezone', 'America/Sao_Paulo'));
    }

    private function extrairValor(array $payload, array $caminhos): ?string
    {
        foreach ($caminhos as $caminho) {
            $valor = data_get($payload, $caminho);

            if (is_string($valor) && trim($valor) !== '') {
                return trim($valor);
            }
        }

        return null;
    }
}
