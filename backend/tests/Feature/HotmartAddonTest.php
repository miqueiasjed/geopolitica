<?php

namespace Tests\Feature;

use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookToken;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class HotmartAddonTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);

        config([
            'app.frontend_url'        => 'http://localhost:5173',
            'addons.hotmart_products' => [
                'ADDON_TEST_PRODUCT_ID' => 'elections',
            ],
        ]);

        WebhookToken::create([
            'fonte'     => 'hotmart',
            'descricao' => 'Teste',
            'token'     => 'segredo-teste',
            'ativo'     => true,
        ]);

        Mail::fake();
    }

    public function test_purchase_approved_de_addon_ativa_addon_nao_plano(): void
    {
        $usuario = User::factory()->create(['email' => 'addon@teste.com']);

        Assinante::query()->create([
            'user_id'    => $usuario->id,
            'plano'      => 'essencial',
            'ativo'      => true,
            'status'     => 'ativo',
            'addons'     => null,
            'assinado_em' => now(),
        ]);

        $planoAntes = 'essencial';

        $this->withHeader('x-hotmart-webhook-token', 'segredo-teste')
            ->postJson('/api/webhook/hotmart', $this->payloadAddonAprovado())
            ->assertOk()
            ->assertJsonPath('received', true);

        $assinante = Assinante::query()->where('user_id', $usuario->id)->firstOrFail();

        $this->assertContains('elections', $assinante->addons, 'O addon elections deve estar no array de addons');
        $this->assertSame($planoAntes, $assinante->plano, 'O plano não deve ter sido alterado');
    }

    public function test_purchase_approved_de_plano_nao_altera_addons(): void
    {
        $this->withHeader('x-hotmart-webhook-token', 'segredo-teste')
            ->postJson('/api/webhook/hotmart', $this->payloadPlanoAprovado())
            ->assertOk()
            ->assertJsonPath('received', true);

        $assinante = Assinante::query()->whereHas('user', fn ($q) => $q->where('email', 'plano@teste.com'))->first();

        $this->assertNotNull($assinante);
        $this->assertEmpty($assinante->addons, 'Addons deve continuar vazio para compra de plano');
    }

    public function test_purchase_canceled_de_addon_cancela_addon(): void
    {
        $usuario = User::factory()->create(['email' => 'addon-cancel@teste.com']);

        Assinante::query()->create([
            'user_id'    => $usuario->id,
            'plano'      => 'pro',
            'ativo'      => true,
            'status'     => 'ativo',
            'addons'     => ['elections'],
            'assinado_em' => now(),
        ]);

        \App\Models\AssinanteAddon::query()->create([
            'user_id'     => $usuario->id,
            'addon_key'   => 'elections',
            'status'      => 'ativo',
            'fonte'       => 'hotmart',
            'iniciado_em' => now(),
        ]);

        $this->withHeader('x-hotmart-webhook-token', 'segredo-teste')
            ->postJson('/api/webhook/hotmart', $this->payloadAddonCancelado())
            ->assertOk()
            ->assertJsonPath('received', true);

        $assinante = Assinante::query()->where('user_id', $usuario->id)->firstOrFail();

        $this->assertNotContains('elections', $assinante->addons, 'elections deve ter sido removido do array de addons');
    }

    public function test_produto_desconhecido_cai_no_fluxo_de_plano(): void
    {
        // product_id não mapeado → deve tratar como plano sem erros
        $this->withHeader('x-hotmart-webhook-token', 'segredo-teste')
            ->postJson('/api/webhook/hotmart', $this->payloadProdutoDesconhecido())
            ->assertOk()
            ->assertJsonPath('received', true);

        // Deve ter criado/atualizado assinante via fluxo de plano normalmente
        $assinante = Assinante::query()->whereHas('user', fn ($q) => $q->where('email', 'desconhecido@teste.com'))->first();

        $this->assertNotNull($assinante, 'Assinante deve ter sido criado via fluxo de plano');
        $this->assertEmpty($assinante->addons, 'Addons deve estar vazio — produto não era addon');
    }

    // -----------------------------------------------------------------------
    // Helpers de payload
    // -----------------------------------------------------------------------

    private function payloadAddonAprovado(): array
    {
        return [
            'event' => 'PURCHASE_APPROVED',
            'data'  => [
                'buyer'    => [
                    'email' => 'addon@teste.com',
                    'name'  => 'Addon Teste',
                ],
                'subscriber' => [
                    'code' => 'sub-addon-approved',
                ],
                'purchase' => [
                    'approved_date' => '2026-04-27T12:00:00Z',
                    'product'       => [
                        'id'   => 'ADDON_TEST_PRODUCT_ID',
                        'name' => 'Addon Elections',
                    ],
                ],
                'product' => [
                    'id'   => 'ADDON_TEST_PRODUCT_ID',
                    'name' => 'Addon Elections',
                ],
            ],
        ];
    }

    private function payloadPlanoAprovado(): array
    {
        return [
            'event' => 'PURCHASE_APPROVED',
            'data'  => [
                'buyer'    => [
                    'email' => 'plano@teste.com',
                    'name'  => 'Plano Teste',
                ],
                'subscriber' => [
                    'code' => 'sub-plano-approved',
                ],
                'purchase' => [
                    'approved_date' => '2026-04-27T12:00:00Z',
                ],
                'product' => [
                    'name' => 'Plano Pro',
                ],
            ],
        ];
    }

    private function payloadAddonCancelado(): array
    {
        return [
            'event' => 'PURCHASE_CANCELED',
            'data'  => [
                'buyer'    => [
                    'email' => 'addon-cancel@teste.com',
                    'name'  => 'Addon Cancel Teste',
                ],
                'subscriber' => [
                    'code' => 'sub-addon-canceled',
                ],
                'purchase' => [
                    'approved_date' => '2026-04-27T12:00:00Z',
                    'product'       => [
                        'id'   => 'ADDON_TEST_PRODUCT_ID',
                        'name' => 'Addon Elections',
                    ],
                ],
                'product' => [
                    'id'   => 'ADDON_TEST_PRODUCT_ID',
                    'name' => 'Addon Elections',
                ],
            ],
        ];
    }

    private function payloadProdutoDesconhecido(): array
    {
        return [
            'event' => 'PURCHASE_APPROVED',
            'data'  => [
                'buyer'    => [
                    'email' => 'desconhecido@teste.com',
                    'name'  => 'Produto Desconhecido Teste',
                ],
                'subscriber' => [
                    'code' => 'sub-unknown-product',
                ],
                'purchase' => [
                    'approved_date' => '2026-04-27T12:00:00Z',
                    'product'       => [
                        'id'   => 'PRODUTO_NAO_MAPEADO',
                        'name' => 'Plano Essencial',
                    ],
                ],
                'product' => [
                    'id'   => 'PRODUTO_NAO_MAPEADO',
                    'name' => 'Plano Essencial',
                ],
            ],
        ];
    }
}
