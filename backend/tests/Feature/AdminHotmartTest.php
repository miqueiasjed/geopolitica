<?php

namespace Tests\Feature;

use App\Jobs\ImportarAssinantesLastlinkJob;
use App\Mail\BoasVindasMail;
use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookEvento;
use App\Services\ImportacaoAssinantesService;
use Database\Seeders\PlanoSeeder;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminHotmartTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
        $this->seed(PlanoSeeder::class);
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

    public function test_admin_pode_enfileirar_importacao_de_assinantes(): void
    {
        Queue::fake();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin, guard: 'sanctum');

        $this->postJson('/api/admin/assinantes/importar', [
            'plano_padrao' => 'pro',
            'senha_padrao' => 'senha1234',
            'enviar_email' => true,
            'linhas' => [
                [
                    'email' => 'cliente1@example.com',
                    'nome' => 'Cliente Um',
                    'plano' => 'pro',
                    'status' => 'Aprovada',
                    'expira_em' => '2026-05-22',
                ],
                [
                    'email' => 'cliente2@example.com',
                    'nome' => 'Cliente Dois',
                    'plano' => 'reservado',
                    'status' => 'ativo',
                    'expira_em' => '2026-06-22',
                ],
            ],
        ])
            ->assertAccepted()
            ->assertJsonPath('total', 2);

        Queue::assertPushed(ImportarAssinantesLastlinkJob::class, 2);
    }

    public function test_importacao_cria_usuario_assinante_senha_role_e_email(): void
    {
        Mail::fake();

        app(ImportacaoAssinantesService::class)->processarLinha([
            'email' => 'assinante.importado@example.com',
            'nome' => 'Assinante Importado',
            'plano' => 'pro',
            'status' => 'Aprovada',
            'expira_em' => '2026-05-22',
        ], 'senha1234', true);

        $usuario = User::where('email', 'assinante.importado@example.com')->firstOrFail();

        $this->assertSame('Assinante Importado', $usuario->name);
        $this->assertTrue(Hash::check('senha1234', $usuario->password));
        $this->assertTrue($usuario->deve_alterar_senha);
        $this->assertTrue($usuario->hasRole('assinante_pro'));
        $this->assertSame('pro', $usuario->assinante->plano);
        $this->assertSame('ativo', $usuario->assinante->status);
        $this->assertTrue($usuario->assinante->ativo);
        $this->assertSame('2026-05-22', $usuario->assinante->expira_em->toDateString());

        Mail::assertQueued(
            BoasVindasMail::class,
            fn (BoasVindasMail $mail) => $mail->user->is($usuario)
                && $mail->senhaTemporaria === 'senha1234'
                && $mail->plano === 'pro'
        );
    }
}
