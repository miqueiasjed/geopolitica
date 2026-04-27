<?php

namespace Tests\Feature;

use App\Mail\AddonBoasVindasMail;
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
        Config::set('addons.lastlink_products', [
            'PROD_ELECTIONS_TEST' => 'elections',
            'PROD_WAR_TEST'       => 'war',
        ]);
        Config::set('app.frontend_url', 'http://localhost:5173');

        Mail::fake();
    }

    // -----------------------------------------------------------------------
    // Cenário 1 — Compra aprovada: cria conta essencial e ativa addon
    // -----------------------------------------------------------------------

    public function test_compra_aprovada_cria_conta_essencial_e_ativa_addon(): void
    {
        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompra('novo@teste.com', 'Novo Comprador'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $this->assertTrue(
            User::where('email', 'novo@teste.com')->exists(),
            'User deve ter sido criado',
        );

        $assinante = Assinante::query()
            ->whereHas('user', fn ($q) => $q->where('email', 'novo@teste.com'))
            ->firstOrFail();

        $this->assertSame('essencial', $assinante->plano, 'Plano deve ser essencial para conta nova');
        $this->assertContains('elections', $assinante->addons, 'Addon elections deve estar no array de addons');

        $this->assertDatabaseHas('assinante_addons', [
            'addon_key' => 'elections',
            'status'    => 'ativo',
        ]);

        Mail::assertSent(AddonBoasVindasMail::class);
    }

    // -----------------------------------------------------------------------
    // Cenário 2 — Compra aprovada: ativa addon em conta existente
    // -----------------------------------------------------------------------

    public function test_compra_aprovada_ativa_addon_em_conta_existente(): void
    {
        $usuario = User::factory()->create(['email' => 'existente@teste.com']);

        Assinante::query()->create([
            'user_id' => $usuario->id,
            'plano'   => 'pro',
            'ativo'   => true,
            'status'  => 'ativo',
            'addons'  => null,
        ]);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCompra('existente@teste.com', 'Usuário Existente'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $assinante = Assinante::query()->where('user_id', $usuario->id)->firstOrFail();

        $this->assertContains('elections', $assinante->addons, 'Addon elections deve ter sido adicionado');
        $this->assertSame('pro', $assinante->plano, 'Plano não deve ter sido alterado');

        Mail::assertSent(AddonBoasVindasMail::class);
    }

    // -----------------------------------------------------------------------
    // Cenário 3 — Cancelamento remove addon
    // -----------------------------------------------------------------------

    public function test_cancelamento_remove_addon(): void
    {
        $usuario = User::factory()->create(['email' => 'existente@teste.com']);

        Assinante::query()->create([
            'user_id' => $usuario->id,
            'plano'   => 'pro',
            'ativo'   => true,
            'status'  => 'ativo',
            'addons'  => ['elections'],
        ]);

        AssinanteAddon::query()->create([
            'user_id'     => $usuario->id,
            'addon_key'   => 'elections',
            'status'      => 'ativo',
            'fonte'       => 'lastlink',
            'iniciado_em' => now(),
        ]);

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $this->payloadCancelamento('existente@teste.com'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $assinante = Assinante::query()->where('user_id', $usuario->id)->firstOrFail();

        $this->assertNotContains('elections', $assinante->addons, 'Addon elections deve ter sido removido');

        $this->assertDatabaseHas('assinante_addons', [
            'user_id'   => $usuario->id,
            'addon_key' => 'elections',
            'status'    => 'cancelado',
        ]);
    }

    // -----------------------------------------------------------------------
    // Cenário 4 — Token inválido: registra evento mas não processa
    // -----------------------------------------------------------------------

    public function test_token_invalido_registra_evento_mas_nao_processa(): void
    {
        $this->withHeader('x-lastlink-token', 'token-errado')
            ->postJson('/api/webhook/lastlink', $this->payloadCompra('invalido@teste.com', 'Inválido'))
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $evento = WebhookEvento::query()->firstOrFail();

        $this->assertDatabaseCount('webhook_eventos', 1);
        $this->assertFalse($evento->processado, 'Evento não deve estar marcado como processado');
    }

    // -----------------------------------------------------------------------
    // Cenário 5 — Produto desconhecido não causa erro
    // -----------------------------------------------------------------------

    public function test_produto_desconhecido_nao_causa_erro(): void
    {
        $payload = [
            'event'    => 'approved',
            'customer' => ['email' => 'desconhecido@teste.com', 'name' => 'Desconhecido'],
            'product'  => ['id' => 'PROD_INEXISTENTE'],
            'order'    => ['id' => 'ORDER_999'],
        ];

        $this->withHeader('x-lastlink-token', 'test-lastlink-token')
            ->postJson('/api/webhook/lastlink', $payload)
            ->assertOk()
            ->assertExactJson(['received' => true]);

        $this->assertFalse(
            User::where('email', 'desconhecido@teste.com')->exists(),
            'Nenhum User deve ter sido criado para produto desconhecido',
        );
    }

    // -----------------------------------------------------------------------
    // Helpers de payload
    // -----------------------------------------------------------------------

    private function payloadCompra(string $email, string $nome): array
    {
        return [
            'event'    => 'approved',
            'customer' => ['email' => $email, 'name' => $nome],
            'product'  => ['id' => 'PROD_ELECTIONS_TEST'],
            'order'    => ['id' => 'ORDER_001'],
        ];
    }

    private function payloadCancelamento(string $email): array
    {
        return [
            'event'    => 'cancelled',
            'customer' => ['email' => $email],
            'product'  => ['id' => 'PROD_ELECTIONS_TEST'],
            'order'    => ['id' => 'ORDER_002'],
        ];
    }
}
