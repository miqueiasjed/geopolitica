<?php

namespace Tests\Feature;

use App\Models\Assinante;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    public function test_usuario_pode_fazer_login_e_consultar_me(): void
    {
        $usuario = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $usuario->assignRole('admin');
        Assinante::query()->create([
            'user_id' => $usuario->id,
            'plano' => 'pro',
            'ativo' => true,
            'status' => 'ativo',
        ]);

        $respostaLogin = $this->postJson('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $respostaLogin
            ->assertOk()
            ->assertJsonPath('user.email', 'admin@test.com')
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role', 'assinante'],
            ]);

        $token = $respostaLogin->json('token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_login_invalido_retorna_401(): void
    {
        User::factory()->create([
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'senha-incorreta',
        ])->assertUnauthorized();
    }

    public function test_logout_revoga_token_atual(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('admin');

        Sanctum::actingAs($usuario, guard: 'sanctum');

        $this->postJson('/api/auth/logout')->assertNoContent();

        $this->assertCount(0, $usuario->fresh()->tokens);
    }
}
