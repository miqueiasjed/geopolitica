<?php

namespace Tests\Feature;

use App\Models\WebhookEvento;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WebhookHotmartTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
        config([
            'services.hotmart.webhook_token' => 'segredo-teste',
            'app.frontend_url' => 'http://localhost:5173',
        ]);
        Mail::fake();
    }

    public function test_webhook_com_token_correto_retorna_200_e_processa_evento(): void
    {
        $this->withHeader('x-hotmart-webhook-token', 'segredo-teste')
            ->postJson('/api/webhook/hotmart', $this->payload())
            ->assertOk()
            ->assertJsonPath('received', true);

        $evento = WebhookEvento::query()->firstOrFail();

        $this->assertSame('PURCHASE_APPROVED', $evento->event_type);
        $this->assertTrue($evento->processado);
        $this->assertNull($evento->erro);
    }

    public function test_webhook_com_token_incorreto_retorna_200_e_registra_erro(): void
    {
        $this->withHeader('x-hotmart-webhook-token', 'token-invalido')
            ->postJson('/api/webhook/hotmart', $this->payload())
            ->assertOk()
            ->assertJsonPath('received', true);

        $evento = WebhookEvento::query()->firstOrFail();

        $this->assertFalse($evento->processado);
        $this->assertSame('Token de webhook invalido.', $evento->erro);
    }

    private function payload(): array
    {
        return [
            'event' => 'PURCHASE_APPROVED',
            'data' => [
                'buyer' => [
                    'email' => 'webhook@teste.com',
                    'name' => 'Webhook Teste',
                ],
                'subscriber' => [
                    'code' => 'sub-webhook',
                ],
                'product' => [
                    'name' => 'Plano Pro',
                ],
                'purchase' => [
                    'approved_date' => '2026-04-14T12:00:00Z',
                ],
            ],
        ];
    }
}
