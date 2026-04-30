<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Cria as roles do sistema B2C.
 *
 * O controle de acesso usa roles + Gates + lógica inline (sem permissões Spatie explícitas).
 * Esta classe é a fonte de verdade das roles. Os gates e filtros estão referenciados abaixo.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │ ESSENCIAL (assinante_essencial)                                                 │
 * │   Feed de tensões geopolíticas ............. últimas 48 h                       │
 * │   Mapa de calor geopolítico ................ ✓                                  │
 * │   Indicadores de risco ..................... ✓                                   │
 * │   Alertas preditivos por IA ................ nível medium                       │
 * │   Perfis dos países / Meus Países .......... ✓                                  │
 * │   Linha do tempo de crises ................. ✓                                  │
 * │   Chat com IA .............................. 5 perguntas/dia                    │
 * │   Relatórios IA ............................ 2/mês                              │
 * │   Export PDF ............................... ✓                                  │
 * │   Biblioteca ............................... ✗ (Pro+)                           │
 * │   Monitor Eleitoral ........................ ✗ (Pro+)                           │
 * │   Monitor de Guerra ........................ ✗ (Reservado)                      │
 * │   Risk Score de Portfólio .................. ✗ (Pro+)                           │
 * ├─────────────────────────────────────────────────────────────────────────────────┤
 * │ PRO (assinante_pro)                                                             │
 * │   Tudo do Essencial, mais:                                                      │
 * │   Feed de tensões geopolíticas ............. últimas 48 h                       │
 * │   Alertas preditivos por IA ................ nível medium + high                │
 * │   Biblioteca completa com busca ............ conteúdo plano_minimo ≤ pro        │
 * │   Chat com IA .............................. 20 perguntas/dia                   │
 * │   Relatórios IA ............................ 10/mês                             │
 * │   Monitor Eleitoral (eleições globais) ..... ✓                                  │
 * │   Risk Score de Portfólio .................. ✓                                  │
 * │   Monitor de Guerra ........................ ✗ (Reservado)                      │
 * ├─────────────────────────────────────────────────────────────────────────────────┤
 * │ RESERVADO (assinante_reservado)                                                 │
 * │   Tudo do Pro, mais:                                                            │
 * │   Feed de tensões geopolíticas ............. arquivo histórico ilimitado        │
 * │   Alertas preditivos por IA ................ todos os níveis (incluindo low)    │
 * │   Biblioteca completa ...................... sem limite de data                  │
 * │   Chat com IA .............................. ilimitado                           │
 * │   Relatórios IA ............................ ilimitados                         │
 * │   Monitor Eleitoral (eleições globais) ..... ✓                                  │
 * │   Monitor de Guerra (conflitos ativos) ..... ✓                                  │
 * │   Risk Score de Portfólio .................. ✓                                  │
 * ├─────────────────────────────────────────────────────────────────────────────────┤
 * │ ADMIN                                                                           │
 * │   Acesso total sem restrições + painel administrativo                           │
 * └─────────────────────────────────────────────────────────────────────────────────┘
 *
 * Implementações de cada gate/filtro:
 *   Chat limites .......... App\Services\ChatService::verificarLimite
 *   Relatórios limites .... App\Services\RelatorioIaService::verificarLimite
 *   Feed 48h .............. App\Services\FeedConsultaService (ultimas48h)
 *   Alertas nível ......... App\Models\AlertaPreditivo::scopeVisivelPara
 *   Biblioteca plano ...... routes/api.php (role:assinante_pro|assinante_reservado|admin)
 *   Conteúdo plano_minimo . App\Models\Conteudo::scopeAcessivelPor
 *   Monitor Eleitoral ..... App\Http\Controllers\Api\EleicaoController (authorize acessar-vertical)
 *   Monitor de Guerra ..... App\Http\Controllers\Api\WarFeedController (authorize acessar-vertical)
 *   Risk Score ............ App\Http\Controllers\Api\CarteiraRiscoController::verificarAcessoRiskScore
 *   Gate vertical ......... App\Providers\AppServiceProvider (acessar-vertical → temAcessoVertical)
 *   Assinante ativo ....... App\Http\Middleware\EnsureAssinanteAtivo
 */
class RolesSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ([
            'assinante_essencial',
            'assinante_pro',
            'assinante_reservado',
            'admin',
        ] as $role) {
            Role::query()->firstOrCreate([
                'name'       => $role,
                'guard_name' => 'sanctum',
            ]);
        }
    }
}
