<?php

namespace App\Services;

use App\Mail\AddonBoasVindasMail;
use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookEvento;
use Illuminate\Auth\Passwords\PasswordBrokerManager;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class LastlinkHandlerService
{
    public function registrarEvento(array $payload): WebhookEvento
    {
        $eventType = $payload['event'] ?? $payload['status'] ?? $payload['type'] ?? 'UNKNOWN';
        $email = $payload['customer']['email'] ?? null;

        return WebhookEvento::query()->create([
            'fonte'                   => 'lastlink',
            'event_type'              => 'LASTLINK_' . strtoupper((string) $eventType),
            'email'                   => $email,
            'payload'                 => $payload,
            'processado'              => false,
            'hotmart_subscriber_code' => null,
        ]);
    }

    public function handle(WebhookEvento $evento): void
    {
        try {
            $tipo = strtoupper($evento->event_type);

            match (true) {
                in_array($tipo, ['LASTLINK_APPROVED', 'LASTLINK_COMPLETE', 'LASTLINK_PAID'], true)
                    => $this->handleCompra($evento->payload),
                in_array($tipo, ['LASTLINK_CANCELLED', 'LASTLINK_CANCELED'], true)
                    => $this->handleCancelamento($evento->payload, 'cancelado'),
                $tipo === 'LASTLINK_REFUNDED'
                    => $this->handleCancelamento($evento->payload, 'reembolsado'),
                $tipo === 'LASTLINK_CHARGEBACK'
                    => $this->handleCancelamento($evento->payload, 'reembolsado'),
                default => null,
            };

            $evento->update([
                'processado'    => true,
                'processado_em' => now(),
            ]);
        } catch (\Throwable $e) {
            $evento->update(['erro' => $e->getMessage()]);
        }
    }

    private function handleCompra(array $payload): void
    {
        $email = $payload['customer']['email'] ?? null;

        if (! $email) {
            return;
        }

        $nome      = $payload['customer']['name'] ?? 'Assinante GPI';
        $productId = $payload['product']['id'] ?? $payload['product_id'] ?? null;
        $orderId   = $payload['order']['id'] ?? $payload['order_id'] ?? null;

        $addonKey = $productId ? AddonService::resolverAddonKey((string) $productId, 'lastlink') : null;

        if ($addonKey === null) {
            return;
        }

        $usuario = User::firstOrCreate(
            ['email' => $email],
            ['name' => $nome, 'password' => Str::password(24)],
        );

        if ($usuario->wasRecentlyCreated) {
            Assinante::create([
                'user_id' => $usuario->id,
                'plano'   => 'essencial',
                'ativo'   => true,
                'status'  => 'ativo',
            ]);

            $token      = app(PasswordBrokerManager::class)->broker()->createToken($usuario);
            $linkAcesso = rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/')
                . '/redefinir-senha?token=' . $token . '&email=' . urlencode($email);

            Mail::to($email)->send(new AddonBoasVindasMail($nome, $addonKey, $linkAcesso, true));
        } else {
            $linkAcesso = rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/') . '/dashboard';

            Mail::to($email)->send(new AddonBoasVindasMail($nome, $addonKey, $linkAcesso, false));
        }

        (new AddonService())->ativar($usuario->id, $addonKey, 'lastlink', $orderId, $productId);
    }

    private function handleCancelamento(array $payload, string $motivo): void
    {
        $email = $payload['customer']['email'] ?? null;

        if (! $email) {
            return;
        }

        $usuario = User::where('email', $email)->first();

        if (! $usuario) {
            return;
        }

        $productId = $payload['product']['id'] ?? $payload['product_id'] ?? null;
        $addonKey  = $productId ? AddonService::resolverAddonKey((string) $productId, 'lastlink') : null;

        if ($addonKey === null) {
            return;
        }

        (new AddonService())->cancelar($usuario->id, $addonKey, $motivo);
    }
}
