<?php

namespace Tests\Feature;

use App\Mail\BoasVindasMail;
use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookEvento;
use App\Services\HotmartHandlerService;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class HotmartHandlerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
        config([
            'app.frontend_url' => 'http://localhost:5173',
        ]);
    }

    public function test_purchase_approved_cria_usuario_assinante_role_e_envia_email(): void
    {
        Mail::fake();

        $evento = WebhookEvento::query()->create([
            'event_type' => 'PURCHASE_APPROVED',
            'email' => 'novo@teste.com',
            'hotmart_subscriber_code' => 'sub-001',
            'payload' => $this->payloadBase(),
        ]);

        app(HotmartHandlerService::class)->handle($evento);

        $usuario = User::query()->where('email', 'novo@teste.com')->firstOrFail();

        $this->assertTrue($usuario->hasRole('assinante_pro'));
        $this->assertDatabaseHas('assinantes', [
            'user_id' => $usuario->id,
            'plano' => 'pro',
            'ativo' => true,
            'status' => 'ativo',
        ]);
        $this->assertDatabaseHas('webhook_eventos', [
            'id' => $evento->id,
            'processado' => true,
        ]);

        Mail::assertQueued(BoasVindasMail::class, fn (BoasVindasMail $mail) => $mail->user->is($usuario));
    }

    public function test_purchase_approved_e_idempotente_para_mesmo_email(): void
    {
        Mail::fake();

        $service = app(HotmartHandlerService::class);

        $service->handle(WebhookEvento::query()->create([
            'event_type' => 'PURCHASE_APPROVED',
            'email' => 'dup@teste.com',
            'hotmart_subscriber_code' => 'sub-dup',
            'payload' => $this->payloadBase(email: 'dup@teste.com', codigo: 'sub-dup'),
        ]));

        $service->handle(WebhookEvento::query()->create([
            'event_type' => 'PURCHASE_APPROVED',
            'email' => 'dup@teste.com',
            'hotmart_subscriber_code' => 'sub-dup',
            'payload' => $this->payloadBase(email: 'dup@teste.com', codigo: 'sub-dup'),
        ]));

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('assinantes', 1);
    }

    public function test_switch_plan_atualiza_plano_e_role(): void
    {
        Mail::fake();

        $usuario = User::factory()->create([
            'email' => 'troca@teste.com',
        ]);
        $usuario->assignRole('assinante_essencial');

        Assinante::query()->create([
            'user_id' => $usuario->id,
            'plano' => 'essencial',
            'ativo' => true,
            'status' => 'ativo',
            'hotmart_subscriber_code' => 'sub-switch',
        ]);

        $evento = WebhookEvento::query()->create([
            'event_type' => 'SWITCH_PLAN',
            'email' => 'troca@teste.com',
            'hotmart_subscriber_code' => 'sub-switch',
            'payload' => $this->payloadBase(
                email: 'troca@teste.com',
                codigo: 'sub-switch',
                produto: 'Plano Reservado',
            ),
        ]);

        app(HotmartHandlerService::class)->handle($evento);

        $usuario->refresh();

        $this->assertTrue($usuario->hasRole('assinante_reservado'));
        $this->assertFalse($usuario->hasRole('assinante_essencial'));
        $this->assertDatabaseHas('assinantes', [
            'user_id' => $usuario->id,
            'plano' => 'reservado',
        ]);
    }

    private function payloadBase(
        string $email = 'novo@teste.com',
        string $codigo = 'sub-001',
        string $produto = 'Plano Pro',
    ): array {
        return [
            'event' => 'PURCHASE_APPROVED',
            'data' => [
                'buyer' => [
                    'email' => $email,
                    'name' => 'Usuario Teste',
                ],
                'subscriber' => [
                    'code' => $codigo,
                ],
                'product' => [
                    'name' => $produto,
                ],
                'purchase' => [
                    'approved_date' => '2026-04-14T12:00:00Z',
                ],
            ],
        ];
    }
}
