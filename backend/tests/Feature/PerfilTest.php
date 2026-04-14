<?php

namespace Tests\Feature;

use App\Models\Assinante;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PerfilTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    public function test_usuario_ativo_pode_ver_e_atualizar_perfil(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('assinante_pro');
        Assinante::query()->create([
            'user_id' => $usuario->id,
            'plano' => 'pro',
            'ativo' => true,
            'status' => 'ativo',
        ]);

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/perfil')
            ->assertOk()
            ->assertJsonPath('user.email', $usuario->email);

        $this->patchJson('/api/perfil', [
            'name' => 'Nome Atualizado',
            'email' => 'novo@email.test',
            'password' => 'novasenha123',
            'password_confirmation' => 'novasenha123',
        ])->assertOk()
            ->assertJsonPath('user.name', 'Nome Atualizado')
            ->assertJsonPath('user.email', 'novo@email.test');
    }

    public function test_assinante_inativo_recebe_403_no_perfil(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('assinante_essencial');
        Assinante::query()->create([
            'user_id' => $usuario->id,
            'plano' => 'essencial',
            'ativo' => false,
            'status' => 'cancelado',
        ]);

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/perfil')
            ->assertForbidden()
            ->assertJsonPath('message', 'Assinatura inativa.');
    }

    public function test_admin_passa_pelo_middleware_sem_assinante(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('admin');

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->getJson('/api/perfil')
            ->assertOk()
            ->assertJsonPath('user.role', 'admin');
    }
}
