<?php

namespace Tests\Feature;

use App\Jobs\ProcessFeedUpdateJob;
use App\Models\Assinante;
use App\Models\Event;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FeedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    public function test_unauthenticated_returns_401(): void
    {
        $this->get('/api/feed')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Não autenticado.');
    }

    public function test_inactive_subscriber_returns_403(): void
    {
        $usuario = $this->criarAssinante('assinante_essencial', ativo: false);

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/feed')
            ->assertForbidden()
            ->assertJsonPath('message', 'Assinatura inativa.');
    }

    public function test_essencial_subscriber_gets_max_20_events(): void
    {
        $usuario = $this->criarAssinante('assinante_essencial');

        Event::factory()->count(30)->relevante()->ultimas48h()->create();

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/feed?limite=50')
            ->assertOk()
            ->assertJsonCount(20, 'data');
    }

    public function test_reservado_subscriber_gets_full_history(): void
    {
        $usuario = $this->criarAssinante('assinante_reservado');

        Event::factory()->count(10)->relevante()->ultimas48h()->create();
        Event::factory()->count(15)->relevante()->create([
            'publicado_em' => now()->subDays(10),
        ]);

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/feed?limite=50')
            ->assertOk()
            ->assertJsonCount(25, 'data');
    }

    public function test_category_filter_works(): void
    {
        $usuario = $this->criarAssinante('assinante_pro');

        Event::factory()->relevante()->ultimas48h()->create([
            'categorias' => ['energia'],
        ]);
        Event::factory()->relevante()->ultimas48h()->create([
            'categorias' => ['alimentos'],
        ]);

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/feed?categoria=energia')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.categorias.0', 'energia');
    }

    public function test_admin_can_trigger_update(): void
    {
        Queue::fake();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin, guard: 'sanctum');

        $this->postJson('/api/feed/atualizar')
            ->assertStatus(202)
            ->assertJsonPath('message', 'Atualização em andamento.');

        Queue::assertPushed(ProcessFeedUpdateJob::class);
    }

    public function test_non_admin_cannot_trigger_update(): void
    {
        Queue::fake();

        $usuario = $this->criarAssinante('assinante_pro');

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->postJson('/api/feed/atualizar')->assertForbidden();
        Queue::assertNothingPushed();
    }

    private function criarAssinante(string $role, bool $ativo = true): User
    {
        $usuario = User::factory()->create();
        $usuario->assignRole($role);

        Assinante::query()->create([
            'user_id' => $usuario->id,
            'plano' => str_replace('assinante_', '', $role),
            'ativo' => $ativo,
            'status' => $ativo ? 'ativo' : 'cancelado',
            'assinado_em' => now(),
        ]);

        return $usuario;
    }
}
