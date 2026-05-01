<?php

namespace Tests\Feature;

use App\Mail\AddonBoasVindasMail;
use App\Mail\AcessoLiberadoMail;
use App\Mail\BoasVindasMail;
use App\Mail\CancelamentoMail;
use App\Mail\ReembolsoMail;
use App\Models\Assinante;
use App\Models\AssinanteAddon;
use App\Models\User;
use App\Models\WebhookEvento;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WebhookLastlinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);

        Config::set('services.lastlink.webhook_token', 'test-lastlink-token');

        // Addons: identificados por product_id único (produtos separados na Lastlink)
        Config::set('addons.lastlink_products', [
            'PROD_ELECTIONS_TEST' => 'elections',
            'PROD_WAR_TEST'       => 'war',
        ]);

        // Planos: identificados por offer code (URL /p/XXXXXXX/) — um produto, várias ofertas
        Config::set('addons.lastlink_offers', [
            'OFFER_ESSENCIAL_TEST'   => 'essencial',
            'OFFER_PRO_TEST'         => 'pro',
            'OFFER_RESERVADO_TEST'   => 'reservado',
            'OFFER_RESERVADO_2_TEST' => 'reservado',
        ]);

        Config::set('app.frontend_url', 'http://localhost:5173');

        Mail::fake();
    }

    // -----------------------------------------------------------------------
    // Planos via offer code — Compra
    // -----------------------------------------------------------------------

    public function test_compra_plano_por_offer_code_cria_conta_e_atribui_role(): void
    {
        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('novo@teste.com', 'Novo Assinante', 'OFFER_PRO_TEST'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $usuario = User::where('email', 'novo@teste.com')->firstOrFail();

        $this->assertTrue($usuario->hasRole('assinante_pro'));
        $this->assertSame('pro', $usuario->assinante->plano);
        $this->assertTrue($usuario->assinante->ativo);

        $this->assertStringContainsString('novo@teste.com', WebhookEvento::latest()->first()->log_acao);
        $this->assertStringContainsString('Conta criada', WebhookEvento::latest()->first()->log_acao);

        Mail::assertQueued(BoasVindasMail::class);
    }

    public function test_compra_plano_essencial_por_offer_code(): void
    {
        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('essencial@teste.com', 'Essencial', 'OFFER_ESSENCIAL_TEST'))
            ->assertOk();

        $usuario = User::where('email', 'essencial@teste.com')->firstOrFail();
        $this->assertTrue($usuario->hasRole('assinante_essencial'));
        $this->assertSame('essencial', $usuario->assinante->plano);
    }

    public function test_oferta_alternativa_reservado_mapeia_para_o_mesmo_plano(): void
    {
        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('reservado2@teste.com', 'Reservado 2', 'OFFER_RESERVADO_2_TEST'))
            ->assertOk();

        $usuario = User::where('email', 'reservado2@teste.com')->firstOrFail();
        $this->assertTrue($usuario->hasRole('assinante_reservado'));
        $this->assertSame('reservado', $usuario->assinante->plano);
    }

    public function test_compra_plano_por_nome_quando_offer_code_nao_mapeado(): void
    {
        // Fallback: offer code desconhecido, mas nome da oferta identifica o plano
        $payload = [
            'event'    => 'approved',
            'customer' => ['email' => 'fallback@teste.com', 'name' => 'Fallback'],
            'offer'    => ['id' => 'OFFER_DESCONHECIDA', 'name' => 'Plano Pro Anual'],
        ];

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $payload)
            ->assertOk();

        $usuario = User::where('email', 'fallback@teste.com')->firstOrFail();
        $this->assertSame('pro', $usuario->assinante->plano);
    }

    public function test_upgrade_de_plano_troca_role_sem_enviar_email(): void
    {
        $usuario = User::factory()->create(['email' => 'upgrade@teste.com']);
        $usuario->assignRole('assinante_essencial');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'essencial', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('upgrade@teste.com', 'Upgrade', 'OFFER_PRO_TEST'))
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->hasRole('assinante_essencial'));
        $this->assertTrue($usuario->hasRole('assinante_pro'));
        $this->assertSame('pro', $usuario->assinante->plano);

        $this->assertStringContainsString('Plano atualizado', WebhookEvento::latest()->first()->log_acao);

        Mail::assertNothingQueued();
    }

    public function test_reativacao_de_plano_envia_email_acesso_liberado(): void
    {
        $usuario = User::factory()->create(['email' => 'reativar@teste.com']);
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => false, 'status' => 'cancelado']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('reativar@teste.com', 'Reativar', 'OFFER_PRO_TEST'))
            ->assertOk();

        $this->assertTrue($usuario->fresh()->assinante->ativo);
        Mail::assertQueued(AcessoLiberadoMail::class);
    }

    // -----------------------------------------------------------------------
    // Planos — Cancelamento / Reembolso
    // -----------------------------------------------------------------------

    public function test_cancelamento_plano_desativa_assinatura_e_envia_email(): void
    {
        $usuario = User::factory()->create(['email' => 'cancelar@teste.com']);
        $usuario->assignRole('assinante_pro');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCancelamentoPlano('cancelar@teste.com', 'OFFER_PRO_TEST'))
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->assinante->ativo);
        $this->assertSame('cancelado', $usuario->assinante->status);
        $this->assertFalse($usuario->hasRole('assinante_pro'));

        $this->assertStringContainsString('cancelado', WebhookEvento::latest()->first()->log_acao);
        $this->assertStringContainsString('cancelar@teste.com', WebhookEvento::latest()->first()->log_acao);

        Mail::assertQueued(CancelamentoMail::class);
    }

    public function test_reembolso_plano_desativa_e_envia_email_reembolso(): void
    {
        $usuario = User::factory()->create(['email' => 'reembolso@teste.com']);
        $usuario->assignRole('assinante_essencial');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'essencial', 'ativo' => true, 'status' => 'ativo']);

        $payload = array_merge(
            $this->payloadCancelamentoPlano('reembolso@teste.com', 'OFFER_ESSENCIAL_TEST'),
            ['event' => 'refunded'],
        );

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $payload)
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->assinante->ativo);
        $this->assertSame('reembolsado', $usuario->assinante->status);

        $this->assertStringContainsString('Reembolso', WebhookEvento::latest()->first()->log_acao);

        Mail::assertQueued(ReembolsoMail::class);
    }

    // -----------------------------------------------------------------------
    // Addons — product_id único (produto separado na Lastlink)
    // -----------------------------------------------------------------------

    public function test_compra_addon_cria_conta_essencial_e_ativa_addon(): void
    {
        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraAddon('novo@teste.com', 'Novo Comprador', 'PROD_ELECTIONS_TEST'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $assinante = Assinante::whereHas('user', fn ($q) => $q->where('email', 'novo@teste.com'))->firstOrFail();
        $this->assertSame('essencial', $assinante->plano);
        $this->assertContains('elections', $assinante->addons);
        $this->assertDatabaseHas('assinante_addons', ['addon_key' => 'elections', 'status' => 'ativo']);
        Mail::assertQueued(AddonBoasVindasMail::class);
    }

    public function test_compra_addon_ativa_addon_em_conta_existente(): void
    {
        $usuario = User::factory()->create(['email' => 'existente@teste.com']);
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraAddon('existente@teste.com', 'Existente', 'PROD_ELECTIONS_TEST'))
            ->assertOk();

        $assinante = $usuario->fresh()->assinante;
        $this->assertContains('elections', $assinante->addons);
        $this->assertSame('pro', $assinante->plano);
        Mail::assertQueued(AddonBoasVindasMail::class);
    }

    public function test_cancelamento_addon_remove_addon(): void
    {
        $usuario = User::factory()->create(['email' => 'existente@teste.com']);
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => true, 'status' => 'ativo', 'addons' => ['elections']]);
        AssinanteAddon::create(['user_id' => $usuario->id, 'addon_key' => 'elections', 'status' => 'ativo', 'fonte' => 'lastlink', 'iniciado_em' => now()]);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCancelamentoAddon('existente@teste.com', 'PROD_ELECTIONS_TEST'))
            ->assertOk();

        $assinante = $usuario->fresh()->assinante;
        $this->assertNotContains('elections', $assinante->addons);
        $this->assertDatabaseHas('assinante_addons', ['user_id' => $usuario->id, 'addon_key' => 'elections', 'status' => 'cancelado']);
    }

    // -----------------------------------------------------------------------
    // Payload PascalCase (formato novo Lastlink) — Compra / Renovação
    // -----------------------------------------------------------------------

    public function test_payload_pascal_case_ativa_assinatura_com_expira_em(): void
    {
        $nextBilling = '2026-05-30T03:23:38.1416146Z';

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Purchase_Order_Confirmed', 'pascal@teste.com', 'Pascal User', 'OFFER_PRO_TEST', 1, $nextBilling))
            ->assertOk();

        $usuario = User::where('email', 'pascal@teste.com')->firstOrFail();
        $this->assertTrue($usuario->hasRole('assinante_pro'));
        $this->assertNotNull($usuario->assinante->expira_em);
        Mail::assertQueued(BoasVindasMail::class);
    }

    public function test_renovacao_de_assinatura_atualiza_expira_em(): void
    {
        $usuario = User::factory()->create(['email' => 'renovar@teste.com']);
        $usuario->assignRole('assinante_pro');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => true, 'status' => 'ativo']);

        $nextBilling = '2026-06-30T03:00:00.0000000Z';

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Purchase_Order_Confirmed', 'renovar@teste.com', 'Renovar', 'OFFER_PRO_TEST', 2, $nextBilling))
            ->assertOk();

        $assinante = $usuario->fresh()->assinante;
        $this->assertTrue($assinante->ativo);
        $this->assertNotNull($assinante->expira_em);
        Mail::assertNothingQueued();
    }

    public function test_product_access_started_ativa_assinatura(): void
    {
        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Product_Access_Started', 'access@teste.com', 'Access User', 'OFFER_ESSENCIAL_TEST'))
            ->assertOk();

        $usuario = User::where('email', 'access@teste.com')->firstOrFail();
        $this->assertTrue($usuario->hasRole('assinante_essencial'));
        $this->assertTrue($usuario->assinante->ativo);
        Mail::assertQueued(BoasVindasMail::class);
    }

    // -----------------------------------------------------------------------
    // Novos eventos de desativação
    // -----------------------------------------------------------------------

    public function test_subscription_expired_desativa_com_status_expirado(): void
    {
        $usuario = User::factory()->create(['email' => 'expirar@teste.com']);
        $usuario->assignRole('assinante_pro');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Subscription_Expired', 'expirar@teste.com', 'Expirar', 'OFFER_PRO_TEST'))
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->assinante->ativo);
        $this->assertSame('expirado', $usuario->assinante->status);
        $this->assertFalse($usuario->hasRole('assinante_pro'));
        Mail::assertQueued(CancelamentoMail::class);
    }

    public function test_product_access_ended_desativa_com_status_expirado(): void
    {
        $usuario = User::factory()->create(['email' => 'acesso-fim@teste.com']);
        $usuario->assignRole('assinante_essencial');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'essencial', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Product_Access_Ended', 'acesso-fim@teste.com', 'Acesso Fim', 'OFFER_ESSENCIAL_TEST'))
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->assinante->ativo);
        $this->assertSame('expirado', $usuario->assinante->status);
    }

    public function test_payment_refund_desativa_como_reembolsado(): void
    {
        $usuario = User::factory()->create(['email' => 'refund@teste.com']);
        $usuario->assignRole('assinante_pro');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Payment_Refund', 'refund@teste.com', 'Refund', 'OFFER_PRO_TEST'))
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->assinante->ativo);
        $this->assertSame('reembolsado', $usuario->assinante->status);
        Mail::assertQueued(ReembolsoMail::class);
    }

    public function test_payment_chargeback_desativa_como_reembolsado(): void
    {
        $usuario = User::factory()->create(['email' => 'chargeback@teste.com']);
        $usuario->assignRole('assinante_essencial');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'essencial', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Payment_Chargeback', 'chargeback@teste.com', 'Chargeback', 'OFFER_ESSENCIAL_TEST'))
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->assinante->ativo);
        $this->assertSame('reembolsado', $usuario->assinante->status);
    }

    // -----------------------------------------------------------------------
    // Eventos sem ação (apenas registrado, não processa negócio)
    // -----------------------------------------------------------------------

    public function test_recurrent_payment_renova_assinatura(): void
    {
        $usuario = User::factory()->create(['email' => 'renovar2@teste.com']);
        $usuario->assignRole('assinante_pro');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => true, 'status' => 'ativo']);

        $nextBilling = '2026-07-30T03:00:00.0000000Z';

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Recurrent_Payment', 'renovar2@teste.com', 'Renovar', 'OFFER_PRO_TEST', 3, $nextBilling))
            ->assertOk();

        $assinante = $usuario->fresh()->assinante;
        $this->assertTrue($assinante->ativo);
        $this->assertNotNull($assinante->expira_em);
        $this->assertDatabaseHas('webhook_eventos', ['event_type' => 'LASTLINK_RECURRENT_PAYMENT']);
        Mail::assertNothingQueued();
    }

    public function test_switch_plan_atualiza_plano_e_role(): void
    {
        $usuario = User::factory()->create(['email' => 'switch@teste.com']);
        $usuario->assignRole('assinante_essencial');
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'essencial', 'ativo' => true, 'status' => 'ativo']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Switch_Plan', 'switch@teste.com', 'Switch', 'OFFER_PRO_TEST'))
            ->assertOk();

        $usuario->refresh();
        $this->assertFalse($usuario->hasRole('assinante_essencial'));
        $this->assertTrue($usuario->hasRole('assinante_pro'));
        $this->assertSame('pro', $usuario->assinante->plano);
    }

    public function test_subscription_product_access_ativa_assinatura(): void
    {
        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadNovo('Subscription_Product_Access', 'sub-access@teste.com', 'Sub Access', 'OFFER_ESSENCIAL_TEST'))
            ->assertOk();

        $usuario = User::where('email', 'sub-access@teste.com')->firstOrFail();
        $this->assertTrue($usuario->hasRole('assinante_essencial'));
    }

    // -----------------------------------------------------------------------
    // Eventos ignorados — não geram registro no banco
    // -----------------------------------------------------------------------

    public function test_eventos_ignorados_nao_geram_registro_no_banco(): void
    {
        $ignorados = [
            'Refund_Requested',
            'Refund_Period_Over',
            'Subscription_Renewal_Pending',
            'Purchase_Request_Expired',
            'Purchase_Request_Canceled',
            'Purchase_Request_Confirmed',
            'Abandoned_Cart',
            'Purchase_Expired',
        ];

        foreach ($ignorados as $evento) {
            $this->withHeader('x-lastlink-token', 'test-lastlink-token')
                ->postJson('/api/webhook/lastlink', $this->payloadNovo($evento, 'ignorado@teste.com', 'Ignorado', 'OFFER_PRO_TEST'))
                ->assertOk();
        }

        $this->assertDatabaseEmpty('webhook_eventos');
        Mail::assertNothingQueued();
    }

    // -----------------------------------------------------------------------
    // Token inválido e produto desconhecido
    // -----------------------------------------------------------------------

    public function test_token_invalido_registra_evento_mas_nao_processa(): void
    {
        $this->withHeader('x-lastlink-token', 'token-errado')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('invalido@teste.com', 'Inválido', 'OFFER_PRO_TEST'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $evento = WebhookEvento::query()->firstOrFail();
        $this->assertFalse($evento->processado);
        $this->assertNull($evento->log_acao);
    }

    public function test_offer_e_produto_desconhecidos_nao_criam_usuario(): void
    {
        $payload = [
            'event'    => 'approved',
            'customer' => ['email' => 'desconhecido@teste.com', 'name' => 'Desconhecido'],
            'product'  => ['id' => 'PROD_INEXISTENTE'],
            'offer'    => ['id' => 'OFFER_INEXISTENTE', 'name' => 'Outro Produto'],
        ];

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $payload)
            ->assertOk();

        $this->assertFalse(User::where('email', 'desconhecido@teste.com')->exists());
    }

    // -----------------------------------------------------------------------
    // Helpers de payload
    // -----------------------------------------------------------------------

    private function payloadNovo(string $event, string $email, string $nome, string $offerCode, int $recurrency = 1, ?string $nextBilling = null): array
    {
        return [
            'Id'        => 'test-' . str_replace('_', '-', strtolower($event)),
            'Event'     => $event,
            'IsTest'    => true,
            'CreatedAt' => '2026-04-30T03:23:38',
            'Data'      => [
                'Buyer'    => ['Name' => $nome, 'Email' => $email],
                'Offer'    => ['Id' => $offerCode, 'Name' => 'Plano GPI'],
                'Purchase' => [
                    'Recurrency'  => $recurrency,
                    'NextBilling' => $nextBilling ?? '2026-05-30T03:23:38.0000000Z',
                ],
            ],
        ];
    }

    private function payloadCompraPlano(string $email, string $nome, string $offerCode): array
    {
        return [
            'event'    => 'approved',
            'customer' => ['email' => $email, 'name' => $nome],
            'offer'    => ['id' => $offerCode, 'name' => 'Plano GPI'],
            'order'    => ['id' => 'ORDER_001'],
        ];
    }

    private function payloadCancelamentoPlano(string $email, string $offerCode): array
    {
        return [
            'event'    => 'cancelled',
            'customer' => ['email' => $email],
            'offer'    => ['id' => $offerCode],
            'order'    => ['id' => 'ORDER_002'],
        ];
    }

    private function payloadCompraAddon(string $email, string $nome, string $productId): array
    {
        return [
            'event'    => 'approved',
            'customer' => ['email' => $email, 'name' => $nome],
            'product'  => ['id' => $productId],
            'order'    => ['id' => 'ORDER_003'],
        ];
    }

    private function payloadCancelamentoAddon(string $email, string $productId): array
    {
        return [
            'event'    => 'cancelled',
            'customer' => ['email' => $email],
            'product'  => ['id' => $productId],
            'order'    => ['id' => 'ORDER_004'],
        ];
    }
}
