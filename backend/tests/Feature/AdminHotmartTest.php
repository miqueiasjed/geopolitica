<?php

namespace Tests\Feature;

use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookEvento;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminHotmartTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    public function test_admin_pode_listar_assinantes_com_filtros(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $usuarioPro = User::factory()->create([
            'name' => 'Ana Pro',
            'email' => 'ana@example.com',
        ]);
        Assinante::query()->create([
            'user_id' => $usuarioPro->id,
            'plano' => 'pro',
            'ativo' => true,
            'status' => 'ativo',
            'assinado_em' => now(),
        ]);

        $usuarioEssencial = User::factory()->create([
            'name' => 'Beto Essencial',
            'email' => 'beto@example.com',
        ]);
        Assinante::query()->create([
            'user_id' => $usuarioEssencial->id,
            'plano' => 'essencial',
            'ativo' => false,
            'status' => 'cancelado',
            'assinado_em' => now()->subDay(),
        ]);

        Sanctum::actingAs($admin, guard: 'sanctum');

        $this->getJson('/api/admin/assinantes?search=ana&plano=pro&status=ativo')
            ->assertOk()
            ->assertJsonPath('data.0.email', 'ana@example.com')
            ->assertJsonCount(1, 'data');
    }

    public function test_admin_pode_listar_webhook_eventos_com_filtro_de_processamento(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        WebhookEvento::query()->create([
            'event_type' => 'PURCHASE_APPROVED',
            'email' => 'ok@example.com',
            'payload' => ['event' => 'PURCHASE_APPROVED'],
            'processado' => true,
            'processado_em' => now(),
        ]);

        WebhookEvento::query()->create([
            'event_type' => 'PURCHASE_CANCELED',
            'email' => 'erro@example.com',
            'payload' => ['event' => 'PURCHASE_CANCELED'],
            'processado' => false,
            'erro' => 'Falha teste',
        ]);

        Sanctum::actingAs($admin, guard: 'sanctum');

        $this->getJson('/api/admin/webhook-eventos?processado=false&type=PURCHASE_CANCELED')
            ->assertOk()
            ->assertJsonPath('data.0.event_type', 'PURCHASE_CANCELED')
            ->assertJsonPath('data.0.processado', false)
            ->assertJsonCount(1, 'data');
    }

    public function test_nao_admin_nao_acessa_rotas_admin(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('assinante_pro');

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/admin/assinantes')->assertForbidden();
        $this->getJson('/api/admin/webhook-eventos')->assertForbidden();
    }
}
