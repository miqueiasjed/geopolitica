<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarUsuarioRequest;
use App\Http\Requests\CriarUsuarioRequest;
use App\Models\Assinante;
use App\Models\Plano;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUsuarioController extends Controller
{
    public function roles(): JsonResponse
    {
        $assinante = Plano::orderBy('ordem')
            ->get()
            ->map(fn (Plano $plano) => [
                'role'      => 'assinante_' . $plano->slug,
                'label'     => $plano->nome,
                'assinante' => true,
            ]);

        $fixas = collect([
            ['role' => 'admin',         'label' => 'Admin',         'assinante' => false],
            ['role' => 'company_admin', 'label' => 'Empresa Admin', 'assinante' => false],
        ]);

        return response()->json(['data' => $assinante->concat($fixas)->values()]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with('roles')
            ->withCount('tokens');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->string('role')->trim()->value()) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        $usuarios = $query
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data'         => $usuarios->map(fn (User $u) => $this->serializar($u)),
            'total'        => $usuarios->total(),
            'per_page'     => $usuarios->perPage(),
            'current_page' => $usuarios->currentPage(),
            'last_page'    => $usuarios->lastPage(),
        ]);
    }

    public function store(CriarUsuarioRequest $request): JsonResponse
    {
        $dados = $request->validated();

        $user                     = new User();
        $user->name               = $dados['name'];
        $user->email              = $dados['email'];
        $user->password           = Hash::make($dados['password']);
        $user->deve_alterar_senha = true;
        $user->save();

        Role::firstOrCreate(['name' => $dados['role'], 'guard_name' => 'sanctum']);
        $user->assignRole($dados['role']);

        $plano = $this->planoFromRole($dados['role']);
        if ($plano !== null) {
            Assinante::create([
                'user_id'    => $user->id,
                'plano'      => $plano,
                'ativo'      => true,
                'status'     => 'ativo',
                'assinado_em' => now(),
                'expira_em'  => $dados['expira_em'] ?? null,
            ]);
        }

        $user->load('roles');

        return response()->json([
            'message' => 'Usuário criado com sucesso.',
            'usuario' => $this->serializar($user),
        ], 201);
    }

    public function show(int $usuario): JsonResponse
    {
        $user = User::query()->with(['roles', 'assinante'])->findOrFail($usuario);

        return response()->json($this->serializar($user, detalhado: true));
    }

    public function update(AtualizarUsuarioRequest $request, int $usuario): JsonResponse
    {
        $user  = User::query()->with('assinante')->findOrFail($usuario);
        $dados = $request->validated();

        $expiraEmFornecida = array_key_exists('expira_em', $dados);
        $expiraEm          = $dados['expira_em'] ?? null;
        unset($dados['expira_em']);

        $novoPlano = null;
        if (isset($dados['role'])) {
            Role::firstOrCreate(['name' => $dados['role'], 'guard_name' => 'sanctum']);
            $user->syncRoles([$dados['role']]);
            $novoPlano = $this->planoFromRole($dados['role']);
            unset($dados['role']);
        }

        if (! empty($dados)) {
            $user->update($dados);
        }

        if ($novoPlano !== null) {
            Assinante::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plano'      => $novoPlano,
                    'ativo'      => true,
                    'status'     => 'ativo',
                    'assinado_em' => $user->assinante?->assinado_em ?? now(),
                    'expira_em'  => $expiraEmFornecida ? $expiraEm : $user->assinante?->expira_em,
                ]
            );
        } elseif ($expiraEmFornecida && $user->assinante) {
            $user->assinante->update(['expira_em' => $expiraEm]);
        }

        $user->load('roles');

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'usuario' => $this->serializar($user),
        ]);
    }

    public function destroy(int $usuario): JsonResponse
    {
        $alvo = User::query()->findOrFail($usuario);

        if ($alvo->hasRole('admin') && User::role('admin')->count() <= 1) {
            return response()->json([
                'message' => 'Não é possível excluir o único administrador do sistema.',
            ], 422);
        }

        $alvo->tokens()->delete();
        $alvo->delete();

        return response()->json(['message' => 'Usuário excluído com sucesso.']);
    }

    private function planoFromRole(string $role): ?string
    {
        if (! str_starts_with($role, 'assinante_')) {
            return null;
        }

        $slug = substr($role, strlen('assinante_'));

        return Plano::where('slug', $slug)->exists() ? $slug : null;
    }

    private function serializar(User $user, bool $detalhado = false): array
    {
        $base = [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->getRoleNames()->first(),
            'created_at' => $user->created_at?->toISOString(),
        ];

        if ($detalhado) {
            $base['email_verified_at'] = $user->email_verified_at?->toISOString();
            $base['assinante']         = $user->assinante
                ? [
                    'plano'     => $user->assinante->plano,
                    'ativo'     => $user->assinante->ativo,
                    'status'    => $user->assinante->status,
                    'expira_em' => $user->assinante->expira_em?->toISOString(),
                ]
                : null;
        }

        return $base;
    }
}
