<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Unifica as roles assinante_essencial, assinante_pro e assinante_reservado
     * em uma única role `assinante`. A distinção de plano passa a ser controlada
     * pelo campo `assinantes.plano` e pela tabela `planos`, não pela role.
     *
     * A migration é idempotente: pode ser executada várias vezes sem efeitos colaterais.
     */
    public function up(): void
    {
        $guardName = 'sanctum';

        // 1. Obtém (ou cria) a role `assinante`
        $roleAssinante = DB::table('roles')
            ->where('name', 'assinante')
            ->where('guard_name', $guardName)
            ->first();

        if (! $roleAssinante) {
            $idRoleAssinante = DB::table('roles')->insertGetId([
                'name'       => 'assinante',
                'guard_name' => $guardName,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $idRoleAssinante = $roleAssinante->id;
        }

        // 2. Coleta IDs das roles específicas que serão unificadas
        $rolesEspecificas = DB::table('roles')
            ->whereIn('name', ['assinante_essencial', 'assinante_pro', 'assinante_reservado'])
            ->where('guard_name', $guardName)
            ->pluck('id');

        if ($rolesEspecificas->isNotEmpty()) {
            // 3. Para cada usuário que possua uma das roles específicas, insere `assinante`
            //    (se ainda não tiver). Usa insertOrIgnore para idempotência.
            $usuariosComRoleEspecifica = DB::table('model_has_roles')
                ->whereIn('role_id', $rolesEspecificas)
                ->where('model_type', 'App\\Models\\User')
                ->select('model_id')
                ->distinct()
                ->pluck('model_id');

            foreach ($usuariosComRoleEspecifica as $modelId) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id'    => $idRoleAssinante,
                    'model_type' => 'App\\Models\\User',
                    'model_id'   => $modelId,
                ]);
            }

            // 4. Remove as roles específicas de model_has_roles
            DB::table('model_has_roles')
                ->whereIn('role_id', $rolesEspecificas)
                ->delete();

            // 5. Remove as roles específicas da tabela `roles`
            DB::table('roles')
                ->whereIn('id', $rolesEspecificas)
                ->delete();
        }

        // 6. Limpa o cache de permissões do Spatie
        app()['cache']->forget('spatie.permission.cache');
    }

    public function down(): void
    {
        // A reversão não é segura pois não há como recuperar qual plano
        // cada assinante tinha anteriormente. Apenas recria as roles vazias.
        $guardName = 'sanctum';

        foreach (['assinante_essencial', 'assinante_pro', 'assinante_reservado'] as $nome) {
            DB::table('roles')->insertOrIgnore([
                'name'       => $nome,
                'guard_name' => $guardName,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        app()['cache']->forget('spatie.permission.cache');
    }
};
