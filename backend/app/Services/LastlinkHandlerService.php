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

    private const EVENTOS_IGNORADOS = [
        'LASTLINK_REFUND_REQUESTED',
        'LASTLINK_REFUND_PERIOD_OVER',
        'LASTLINK_SUBSCRIPTION_RENEWAL_PENDING',
        'LASTLINK_PURCHASE_REQUEST_EXPIRED',
        'LASTLINK_PURCHASE_REQUEST_CANCELED',
        'LASTLINK_PURCHASE_REQUEST_CONFIRMED',
        'LASTLINK_ABANDONED_CART',
        'LASTLINK_PURCHASE_EXPIRED',
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

    public function deveIgnorar(array $payload): bool
    {
        $eventType = $this->extrairCampo($payload, [
            'event', 'Event', 'status', 'Status', 'type', 'Type',
        ]) ?? 'UNKNOWN';

        $tipo = 'LASTLINK_' . strtoupper((string) $eventType);

        return in_array($tipo, self::EVENTOS_IGNORADOS, true);
    }

    public function handle(WebhookEvento $evento): void
    {
        try {
            $tipo = strtoupper($evento->event_type);

            $log = match (true) {
                in_array($tipo, [
                    'LASTLINK_APPROVED', 'LASTLINK_COMPLETE', 'LASTLINK_PAID',
                    'LASTLINK_PURCHASE_ORDER_CONFIRMED', 'LASTLINK_ORDER_CONFIRMED',
                    'LASTLINK_PRODUCT_ACCESS_STARTED',
                    'LASTLINK_SUBSCRIPTION_PRODUCT_ACCESS',
                    'LASTLINK_RECURRENT_PAYMENT',
                    'LASTLINK_PURCHASE_APPROVED',
                    'LASTLINK_SWITCH_PLAN',
                ], true)
                    => $this->handleCompra($evento->payload),
                in_array($tipo, [
                    'LASTLINK_CANCELLED', 'LASTLINK_CANCELED',
                    'LASTLINK_PURCHASE_CANCELED', 'LASTLINK_SUBSCRIPTION_CANCELED',
                ], true)
                    => $this->handleCancelamento($evento->payload, 'cancelado'),
                in_array($tipo, [
                    'LASTLINK_REFUNDED', 'LASTLINK_PURCHASE_REFUNDED',
                    'LASTLINK_PAYMENT_REFUND',
                ], true)
                    => $this->handleCancelamento($evento->payload, 'reembolsado'),
                in_array($tipo, [
                    'LASTLINK_CHARGEBACK', 'LASTLINK_PURCHASE_CHARGEBACK',
                    'LASTLINK_PAYMENT_CHARGEBACK',
                ], true)
                    => $this->handleCancelamento($evento->payload, 'reembolsado'),
                in_array($tipo, [
                    'LASTLINK_SUBSCRIPTION_EXPIRED',
                    'LASTLINK_PRODUCT_ACCESS_ENDED',
                ], true)
                    => $this->handleCancelamento($evento->payload, 'expirado'),
                default => 'Evento sem ação mapeada',
            };

            $evento->update([
                'processado'    => true,
                'processado_em' => now(),
                'log_acao'      => $log,
            ]);
        } catch (\Throwable $e) {
            $evento->update([
                'erro'     => $e->getMessage(),
                'log_acao' => 'Erro ao processar: ' . $e->getMessage(),
            ]);
        }
    }

    private function handleCompra(array $payload): string
    {
        $email = $this->extrairEmail($payload);

        if (! $email) {
            return 'Email não encontrado no payload — nenhuma ação tomada';
        }

        // Addons têm product_id próprio — verifica primeiro
        $productId = $this->extrairProdutoId($payload);

        if ($productId) {
            $addonKey = AddonService::resolverAddonKey($productId, 'lastlink');

            if ($addonKey !== null) {
                return $this->ativarAddon($payload, $addonKey);
            }
        }

        // Planos: identifica pela oferta (offer code da URL /p/XXXXXXX/)
        $planoKey = $this->resolverPlano($payload);

        if ($planoKey !== null) {
            return $this->ativarAssinatura($payload, $planoKey);
        }

        return 'Produto ou plano não identificado — nenhuma ação tomada';
    }

    private function handleCancelamento(array $payload, string $motivo): string
    {
        $email = $this->extrairEmail($payload);

        if (! $email) {
            return 'Email não encontrado no payload — nenhuma ação tomada';
        }

        $usuario = User::where('email', $email)->first();

        if (! $usuario) {
            return "Usuário não encontrado: {$email}";
        }

        $productId = $this->extrairProdutoId($payload);

        if ($productId) {
            $addonKey = AddonService::resolverAddonKey($productId, 'lastlink');

            if ($addonKey !== null) {
                (new AddonService())->cancelar($usuario->id, $addonKey, $motivo);

                return "Addon {$addonKey} cancelado ({$motivo}) para {$email}";
            }
        }

        if (! $usuario->assinante?->ativo) {
            return "Assinatura já inativa para {$email} — nenhuma ação tomada";
        }

        return $this->desativarAssinatura($usuario, $motivo);
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

    private function ativarAssinatura(array $payload, string $plano): string
    {
        $email = $this->extrairEmail($payload);
        $nome  = $this->extrairNome($payload, $email);

        $usuario = User::firstOrCreate(
            ['email' => $email],
            ['name' => $nome, 'password' => Str::password(24)],
        );

        $assinante     = Assinante::firstOrNew(['user_id' => $usuario->id]);
        $eraNovo       = ! $assinante->exists;
        $estavaAtivo   = (bool) $assinante->ativo;
        $planoAnterior = $assinante->plano;

        $fillData = [
            'plano'       => $plano,
            'ativo'       => true,
            'status'      => 'ativo',
            'assinado_em' => now(),
        ];

        $proximaCobranca = $this->extrairProximaCobranca($payload);
        if ($proximaCobranca !== null) {
            $fillData['expira_em'] = $proximaCobranca;
        }

        $assinante->fill($fillData)->save();

        $this->sincronizarRolePlano($usuario, $plano);

        if ($usuario->wasRecentlyCreated || $eraNovo) {
            $token = app(PasswordBrokerManager::class)->broker()->createToken($usuario);
            $link  = $this->montarLinkRedefinicao($token, $email);
            Mail::to($email)->send(new BoasVindasMail($usuario, $link, $plano));

            return "Conta criada para {$email} — plano {$plano}";
        }

        if (! $estavaAtivo) {
            Mail::to($email)->send(new AcessoLiberadoMail($usuario, $this->montarLinkAcesso(), $plano));

            return "Acesso reativado para {$email} — plano {$plano}";
        }

        if ($planoAnterior !== $plano) {
            return "Plano atualizado de {$planoAnterior} para {$plano} — {$email}";
        }

        return "Acesso renovado para {$email} — plano {$plano}";
    }

    private function desativarAssinatura(User $usuario, string $status): string
    {
        $assinante = $usuario->assinante;

        if (! $assinante) {
            return "Assinatura não encontrada para {$usuario->email}";
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

            return "Reembolso aplicado para {$usuario->email} — acesso revogado";
        }

        Mail::to($usuario->email)->send(new CancelamentoMail($usuario, $assinante));

        $descricao = match ($status) {
            'cancelado' => 'cancelado',
            'expirado'  => 'expirado',
            default     => $status,
        };

        return "Acesso {$descricao} para {$usuario->email}";
    }

    private function ativarAddon(array $payload, string $addonKey): string
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

            (new AddonService())->ativar($usuario->id, $addonKey, 'lastlink', $orderId, $productId);

            return "Conta criada para {$email} e addon {$addonKey} ativado";
        }

        Mail::to($email)->send(new AddonBoasVindasMail($nome, $addonKey, $this->montarLinkAcesso(), false));

        (new AddonService())->ativar($usuario->id, $addonKey, 'lastlink', $orderId, $productId);

        return "Addon {$addonKey} ativado para {$email}";
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

    private function extrairProximaCobranca(array $payload): ?string
    {
        return $this->extrairCampo($payload, [
            'Data.Purchase.NextBilling',
            'next_billing',
            'next_billing_date',
            'expiry_date',
        ]);
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
