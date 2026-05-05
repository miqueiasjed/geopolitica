<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminConfiguracaoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    public function test_teste_de_mercado_usa_api_key_salva_mesmo_com_config_em_memoria_vazia(): void
    {
        Http::fake(function (Request $request) {
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            $this->assertSame('chave-alpha-salva', $query['apikey'] ?? null);

            return match ($query['function'] ?? null) {
                'CURRENCY_EXCHANGE_RATE' => Http::response([
                    'Realtime Currency Exchange Rate' => [
                        '5. Exchange Rate' => '5.1200',
                    ],
                ]),
                'FX_DAILY' => Http::response([
                    'Time Series FX (Daily)' => [
                        '2026-05-04' => ['4. close' => '5.1000'],
                    ],
                ]),
                default => Http::response([
                    'data' => [
                        ['date' => '2026-05-05', 'value' => '80.00'],
                        ['date' => '2026-05-04', 'value' => '78.00'],
                    ],
                ]),
            };
        });

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Sanctum::actingAs($admin, guard: 'sanctum');

        $this->patchJson('/api/admin/configuracoes', [
            'configuracoes' => [
                'alpha_vantage_api_key' => 'chave-alpha-salva',
            ],
        ])->assertOk();

        Config::set('services.alphavantage.api_key', '');

        $this->postJson('/api/admin/configuracoes/testar-mercado')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(9, 'cotacoes');
    }
}
