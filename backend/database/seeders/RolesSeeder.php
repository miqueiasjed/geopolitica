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
 * │ ASSINANTE (assinante)                                                           │
 * │   Role unificada para todos os assinantes (essencial, pro, reservado).          │
 * │   A distinção de recursos é controlada por `assinantes.plano` e pela            │
 * │   tabela `planos` / `plano_recursos` — não pela role.                           │
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
 *   Biblioteca plano ...... App\Models\Conteudo::scopeAcessivelPor (plano_minimo)
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
            'assinante',
            'admin',
        ] as $role) {
            Role::query()->firstOrCreate([
                'name'       => $role,
                'guard_name' => 'sanctum',
            ]);
        }
    }
}
