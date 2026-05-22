<?php

namespace Tests\Unit;

use App\Models\Assinante;
use App\Models\AssinanteAddon;
use App\Models\Produto;
use App\Models\User;
use App\Services\AddonService;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddonServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesSeeder::class);
    }

    private function criarUsuarioComAssinante(array $assinanteAtributos = []): array
    {
        $usuario = User::factory()->create();

        $assinante = Assinante::query()->create(array_merge([
            'user_id'    => $usuario->id,
            'plano'      => 'essencial',
            'ativo'      => true,
            'status'     => 'ativo',
            'addons'     => null,
            'assinado_em' => now(),
        ], $assinanteAtributos));

        return [$usuario, $assinante];
    }

    public function test_ativar_adiciona_addon_ao_assinante_addons(): void
    {
        [$usuario] = $this->criarUsuarioComAssinante();

        (new AddonService())->ativar($usuario->id, 'elections', 'hotmart');

        $this->assertDatabaseHas('assinante_addons', [
            'user_id'   => $usuario->id,
            'addon_key' => 'elections',
            'status'    => 'ativo',
        ]);
    }

    public function test_ativar_e_idempotente_quando_addon_ja_existe(): void
    {
        [$usuario] = $this->criarUsuarioComAssinante();

        (new AddonService())->ativar($usuario->id, 'elections', 'hotmart');
        (new AddonService())->ativar($usuario->id, 'elections', 'hotmart');

        $ocorrencias = AssinanteAddon::where('user_id', $usuario->id)
            ->where('addon_key', 'elections')
            ->count();

        $this->assertSame(1, $ocorrencias, 'addon_key não deve gerar registros duplicados');
    }

    public function test_ativar_cria_registro_em_assinante_addons(): void
    {
        [$usuario] = $this->criarUsuarioComAssinante();

        (new AddonService())->ativar($usuario->id, 'elections', 'hotmart', 'order-123', 'prod-456');

        $registro = AssinanteAddon::query()
            ->where('user_id', $usuario->id)
            ->where('addon_key', 'elections')
            ->first();

        $this->assertNotNull($registro);
        $this->assertSame('ativo', $registro->status);
        $this->assertSame('hotmart', $registro->fonte);
        $this->assertSame('order-123', $registro->order_id);
        $this->assertSame('prod-456', $registro->product_id);
    }

    public function test_cancelar_atualiza_status_para_cancelado(): void
    {
        [$usuario] = $this->criarUsuarioComAssinante();

        AssinanteAddon::query()->create(['user_id' => $usuario->id, 'addon_key' => 'elections', 'status' => 'ativo', 'fonte' => 'hotmart', 'iniciado_em' => now()]);
        AssinanteAddon::query()->create(['user_id' => $usuario->id, 'addon_key' => 'war',       'status' => 'ativo', 'fonte' => 'hotmart', 'iniciado_em' => now()]);

        (new AddonService())->cancelar($usuario->id, 'elections', 'cancelado');

        $this->assertDatabaseHas('assinante_addons', ['user_id' => $usuario->id, 'addon_key' => 'elections', 'status' => 'cancelado']);
        $this->assertDatabaseHas('assinante_addons', ['user_id' => $usuario->id, 'addon_key' => 'war',       'status' => 'ativo']);
    }

    public function test_cancelar_atualiza_status_em_assinante_addons(): void
    {
        [$usuario] = $this->criarUsuarioComAssinante([
            'addons' => ['elections'],
        ]);

        AssinanteAddon::query()->create([
            'user_id'     => $usuario->id,
            'addon_key'   => 'elections',
            'status'      => 'ativo',
            'fonte'       => 'hotmart',
            'iniciado_em' => now(),
        ]);

        (new AddonService())->cancelar($usuario->id, 'elections', 'reembolsado');

        $registro = AssinanteAddon::query()
            ->where('user_id', $usuario->id)
            ->where('addon_key', 'elections')
            ->first();

        $this->assertNotNull($registro);
        $this->assertSame('reembolsado', $registro->status);
    }

    public function test_cancelar_nao_lanca_excecao_se_addon_nao_existe(): void
    {
        [$usuario] = $this->criarUsuarioComAssinante();

        // Não deve lançar exceção mesmo sem addon ativo
        (new AddonService())->cancelar($usuario->id, 'war', 'cancelado');

        $this->assertTrue(true); // Chegou até aqui sem exception
    }

    public function test_resolver_addon_key_retorna_null_para_produto_desconhecido(): void
    {
        $resultado = AddonService::resolverAddonKey('produto_inexistente', 'hotmart');

        $this->assertNull($resultado);
    }

    public function test_resolver_addon_key_retorna_chave_correta_para_produto_conhecido(): void
    {
        Produto::create([
            'chave'              => 'elections',
            'nome'               => 'Monitor Eleitoral',
            'product_id_hotmart' => 'ADDON_TEST_PRODUCT_ID',
        ]);

        $resultado = AddonService::resolverAddonKey('ADDON_TEST_PRODUCT_ID', 'hotmart');

        $this->assertSame('elections', $resultado);
    }
}
