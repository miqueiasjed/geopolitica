<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminRolesPermissoesController extends Controller
{
    // ── Roles ──────────────────────────────────────────────────────────────────

    public function indexRoles(): JsonResponse
    {
        $roles = Role::with('permissions')
            ->withCount('users')
            ->where('guard_name', 'sanctum')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => [
                'id'                => $role->id,
                'name'              => $role->name,
                'users_count'       => $role->users_count,
                'permissions'       => $role->permissions->pluck('name')->sort()->values(),
                'permissions_count' => $role->permissions->count(),
            ]);

        return response()->json(['data' => $roles]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'name' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/', 'unique:roles,name'],
        ], [
            'name.unique'  => 'Já existe uma role com este nome.',
            'name.regex'   => 'Use apenas letras minúsculas, números e _.',
            'name.required' => 'O nome da role é obrigatório.',
        ]);

        $role = Role::create(['name' => $dados['name'], 'guard_name' => 'sanctum']);

        return response()->json([
            'message' => 'Role criada com sucesso.',
            'role'    => [
                'id'                => $role->id,
                'name'              => $role->name,
                'users_count'       => 0,
                'permissions'       => [],
                'permissions_count' => 0,
            ],
        ], 201);
    }

    public function destroyRole(int $id): JsonResponse
    {
        $role = Role::where('guard_name', 'sanctum')->findOrFail($id);

        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => "Não é possível excluir a role '{$role->name}' pois há {$role->users()->count()} usuário(s) atribuído(s) a ela.",
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role excluída com sucesso.']);
    }

    public function syncPermissoesRole(Request $request, int $id): JsonResponse
    {
        $role = Role::where('guard_name', 'sanctum')->findOrFail($id);

        $dados = $request->validate([
            'permissions'   => ['present', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($dados['permissions']);
        $role->load('permissions');

        return response()->json([
            'message'     => 'Permissões atualizadas.',
            'permissions' => $role->permissions->pluck('name')->sort()->values(),
        ]);
    }

    // ── Permissions ────────────────────────────────────────────────────────────

    public function indexPermissions(): JsonResponse
    {
        $permissions = Permission::with('roles')
            ->where('guard_name', 'sanctum')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $p) => [
                'id'    => $p->id,
                'name'  => $p->name,
                'roles' => $p->roles->where('guard_name', 'sanctum')->pluck('name')->sort()->values(),
            ]);

        return response()->json(['data' => $permissions]);
    }

    public function storePermission(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'name' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_\-\.]+$/', 'unique:permissions,name'],
        ], [
            'name.unique'   => 'Já existe uma permissão com este nome.',
            'name.regex'    => 'Use apenas letras minúsculas, números, _, - e .',
            'name.required' => 'O nome da permissão é obrigatório.',
        ]);

        $permission = Permission::create(['name' => $dados['name'], 'guard_name' => 'sanctum']);

        return response()->json([
            'message'    => 'Permissão criada com sucesso.',
            'permission' => [
                'id'    => $permission->id,
                'name'  => $permission->name,
                'roles' => [],
            ],
        ], 201);
    }

    public function destroyPermission(int $id): JsonResponse
    {
        $permission = Permission::where('guard_name', 'sanctum')->findOrFail($id);
        $permission->delete();

        return response()->json(['message' => 'Permissão excluída com sucesso.']);
    }
}
