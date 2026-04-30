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

        Mail::assertSent(BoasVindasMail::class);
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

        Mail::assertNothingSent();
    }

    public function test_reativacao_de_plano_envia_email_acesso_liberado(): void
    {
        $usuario = User::factory()->create(['email' => 'reativar@teste.com']);
        Assinante::create(['user_id' => $usuario->id, 'plano' => 'pro', 'ativo' => false, 'status' => 'cancelado']);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('reativar@teste.com', 'Reativar', 'OFFER_PRO_TEST'))
            ->assertOk();

        $this->assertTrue($usuario->fresh()->assinante->ativo);
        Mail::assertSent(AcessoLiberadoMail::class);
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
        Mail::assertSent(CancelamentoMail::class);
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
        Mail::assertSent(ReembolsoMail::class);
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
        Mail::assertSent(AddonBoasVindasMail::class);
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
        Mail::assertSent(AddonBoasVindasMail::class);
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
    // Token inválido e produto desconhecido
    // -----------------------------------------------------------------------

    public function test_token_invalido_registra_evento_mas_nao_processa(): void
    {
        $this->withHeader('x-lastlink-token', 'token-errado')
            ->postJson('/api/webhook/lastlink', $this->payloadCompraPlano('invalido@teste.com', 'Inválido', 'OFFER_PRO_TEST'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $this->assertFalse(WebhookEvento::query()->firstOrFail()->processado);
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
