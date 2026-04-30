<?php

namespace App\Services;

use App\Mail\AcessoLiberadoMail;
use App\Mail\AddonBoasVindasMail;
use App\Mail\BoasVindasMail;
use App\Mail\CancelamentoMail;
use App\Mail\ReembolsoMail;
use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookEvento;
use Illuminate\Auth\Passwords\PasswordBrokerManager;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;

class LastlinkHandlerService
{
    private const ROLES_ASSINANTE = [
        'assinante_essencial',
        'assinante_pro',
        'assinante_reservado',
    ];

    public function registrarEvento(array $payload): WebhookEvento
    {
        $eventType = $this->extrairCampo($payload, [
            'event', 'Event', 'status', 'Status', 'type', 'Type',
        ]) ?? 'UNKNOWN';

        $email = $this->extrairEmail($payload);

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
                in_array($tipo, ['LASTLINK_APPROVED', 'LASTLINK_COMPLETE', 'LASTLINK_PAID',
                    'LASTLINK_PURCHASE_ORDER_CONFIRMED', 'LASTLINK_ORDER_CONFIRMED'], true)
                    => $this->handleCompra($evento->payload),
                in_array($tipo, ['LASTLINK_CANCELLED', 'LASTLINK_CANCELED',
                    'LASTLINK_PURCHASE_CANCELED', 'LASTLINK_SUBSCRIPTION_CANCELED'], true)
                    => $this->handleCancelamento($evento->payload, 'cancelado'),
                in_array($tipo, ['LASTLINK_REFUNDED', 'LASTLINK_PURCHASE_REFUNDED'], true)
                    => $this->handleCancelamento($evento->payload, 'reembolsado'),
                in_array($tipo, ['LASTLINK_CHARGEBACK', 'LASTLINK_PURCHASE_CHARGEBACK'], true)
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
        $email = $this->extrairEmail($payload);

        if (! $email) {
            return;
        }

        // Addons têm product_id próprio — verifica primeiro
        $productId = $this->extrairProdutoId($payload);

        if ($productId) {
            $addonKey = AddonService::resolverAddonKey($productId, 'lastlink');

            if ($addonKey !== null) {
                $this->ativarAddon($payload, $addonKey);

                return;
            }
        }

        // Planos: identifica pela oferta (offer code da URL /p/XXXXXXX/)
        $planoKey = $this->resolverPlano($payload);

        if ($planoKey !== null) {
            $this->ativarAssinatura($payload, $planoKey);
        }
    }

    private function handleCancelamento(array $payload, string $motivo): void
    {
        $email = $this->extrairEmail($payload);

        if (! $email) {
            return;
        }

        $usuario = User::where('email', $email)->first();

        if (! $usuario) {
            return;
        }

        $productId = $this->extrairProdutoId($payload);

        if ($productId) {
            $addonKey = AddonService::resolverAddonKey($productId, 'lastlink');

            if ($addonKey !== null) {
                (new AddonService())->cancelar($usuario->id, $addonKey, $motivo);

                return;
            }
        }

        // Se não é addon, cancela o plano principal
        if ($usuario->assinante?->ativo) {
            $this->desativarAssinatura($usuario, $motivo);
        }
    }

    // -------------------------------------------------------------------------
    // Resolução de plano por oferta
    // -------------------------------------------------------------------------

    /**
     * Tenta resolver o plano em ordem de prioridade:
     * 1. Offer code mapeado nas env vars (LASTLINK_OFFER_*)
     * 2. Nome do produto/oferta contendo "essencial", "pro" ou "reservado"
     */
    private function resolverPlano(array $payload): ?string
    {
        $ofertaId = $this->extrairOfertaId($payload);

        if ($ofertaId) {
            $plano = AddonService::resolverPlanoByOferta($ofertaId);

            if ($plano !== null) {
                return $plano;
            }
        }

        return $this->resolverPlanoPorNome($payload);
    }

    /**
     * Extrai o offer code / plan code tentando múltiplos campos,
     * pois a Lastlink pode enviar em estruturas diferentes dependendo
     * da versão da API / tipo de evento.
     */
    private function extrairOfertaId(array $payload): ?string
    {
        return $this->extrairCampo($payload, [
            // snake_case (payload simplificado)
            'offer.id',
            'offer.code',
            'offer_id',
            'offer_code',
            'plan.id',
            'plan.code',
            'plan_id',
            'checkout_code',
            'checkout.code',
            'checkout.id',
            // PascalCase (payload com envelope Data)
            'Data.Offer.Id',
            'Data.Offer.Code',
            'Data.Plan.Id',
            'Data.Plan.Code',
            'Data.Checkout.Code',
            'Data.CheckoutCode',
        ]);
    }

    private function resolverPlanoPorNome(array $payload): ?string
    {
        $nome = $this->extrairCampo($payload, [
            'offer.name',
            'plan.name',
            'product.name',
            'Data.Offer.Name',
            'Data.Plan.Name',
            'Data.Products.0.Name',
        ]) ?? '';

        $lower = Str::of($nome)->lower()->ascii()->value();

        return match (true) {
            str_contains($lower, 'reservado')                                    => 'reservado',
            (bool) preg_match('/\bpro\b/', $lower)                               => 'pro',
            str_contains($lower, 'essencial'), str_contains($lower, 'essential') => 'essencial',
            default                                                               => null,
        };
    }

    // -------------------------------------------------------------------------
    // Ativação e desativação
    // -------------------------------------------------------------------------

    private function ativarAssinatura(array $payload, string $plano): void
    {
        $email = $this->extrairEmail($payload);
        $nome  = $this->extrairNome($payload, $email);

        $usuario = User::firstOrCreate(
            ['email' => $email],
            ['name' => $nome, 'password' => Str::password(24)],
        );

        $assinante   = Assinante::firstOrNew(['user_id' => $usuario->id]);
        $eraNovo     = ! $assinante->exists;
        $estavaAtivo = (bool) $assinante->ativo;

        $assinante->fill([
            'plano'       => $plano,
            'ativo'       => true,
            'status'      => 'ativo',
            'assinado_em' => now(),
        ])->save();

        $this->sincronizarRolePlano($usuario, $plano);

        if ($usuario->wasRecentlyCreated || $eraNovo) {
            $token = app(PasswordBrokerManager::class)->broker()->createToken($usuario);
            $link  = $this->montarLinkRedefinicao($token, $email);
            Mail::to($email)->send(new BoasVindasMail($usuario, $link, $plano));

            return;
        }

        if (! $estavaAtivo) {
            Mail::to($email)->send(new AcessoLiberadoMail($usuario, $this->montarLinkAcesso(), $plano));
        }
    }

    private function desativarAssinatura(User $usuario, string $status): void
    {
        $assinante = $usuario->assinante;

        if (! $assinante) {
            return;
        }

        $assinante->forceFill([
            'ativo'  => false,
            'status' => $status,
        ])->save();

        foreach (self::ROLES_ASSINANTE as $role) {
            if ($usuario->hasRole($role)) {
                $usuario->removeRole($role);
            }
        }

        if ($status === 'reembolsado') {
            Mail::to($usuario->email)->send(new ReembolsoMail($usuario, $assinante));

            return;
        }

        Mail::to($usuario->email)->send(new CancelamentoMail($usuario, $assinante));
    }

    private function ativarAddon(array $payload, string $addonKey): void
    {
        $email     = $this->extrairEmail($payload);
        $nome      = $this->extrairNome($payload, $email);
        $productId = $this->extrairProdutoId($payload);
        $orderId   = $this->extrairCampo($payload, ['order.id', 'order_id', 'Data.Order.Id']);

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

            $token = app(PasswordBrokerManager::class)->broker()->createToken($usuario);
            $link  = $this->montarLinkRedefinicao($token, $email);
            Mail::to($email)->send(new AddonBoasVindasMail($nome, $addonKey, $link, true));
        } else {
            Mail::to($email)->send(new AddonBoasVindasMail($nome, $addonKey, $this->montarLinkAcesso(), false));
        }

        (new AddonService())->ativar($usuario->id, $addonKey, 'lastlink', $orderId, $productId);
    }

    private function sincronizarRolePlano(User $usuario, string $plano): void
    {
        $novaRole = match ($plano) {
            'essencial' => 'assinante_essencial',
            'pro'       => 'assinante_pro',
            'reservado' => 'assinante_reservado',
            default     => throw new RuntimeException("Plano Lastlink não suportado: {$plano}"),
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

    // -------------------------------------------------------------------------
    // Extração de campos (suporta snake_case e PascalCase)
    // -------------------------------------------------------------------------

    private function extrairEmail(array $payload): ?string
    {
        return $this->extrairCampo($payload, [
            'customer.email',
            'buyer.email',
            'Data.Buyer.Email',
            'Data.Customer.Email',
        ]);
    }

    private function extrairNome(array $payload, ?string $emailFallback = null): string
    {
        $nome = $this->extrairCampo($payload, [
            'customer.name',
            'buyer.name',
            'Data.Buyer.Name',
            'Data.Customer.Name',
        ]);

        if ($nome) {
            return $nome;
        }

        return Str::of($emailFallback ?? '')->before('@')->replace(['.', '_', '-'], ' ')->title()->value() ?: 'Assinante GPI';
    }

    private function extrairProdutoId(array $payload): ?string
    {
        $id = $this->extrairCampo($payload, [
            'product.id',
            'product_id',
            'Data.Products.0.Id',
            'Data.Product.Id',
        ]);

        return $id ? (string) $id : null;
    }

    private function extrairCampo(array $payload, array $caminhos): ?string
    {
        foreach ($caminhos as $caminho) {
            $valor = data_get($payload, $caminho);

            if (is_string($valor) && trim($valor) !== '') {
                return trim($valor);
            }
        }

        return null;
    }

    private function montarLinkRedefinicao(string $token, string $email): string
    {
        return rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/')
            . '/redefinir-senha?token=' . urlencode($token) . '&email=' . urlencode($email);
    }

    private function montarLinkAcesso(): string
    {
        return rtrim((string) config('app.frontend_url', env('FRONTEND_URL')), '/') . '/login';
    }
}
