<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarUsuarioRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class AdminUsuarioController extends Controller
{
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

    public function show(int $usuario): JsonResponse
    {
        $user = User::query()->with(['roles', 'assinante'])->findOrFail($usuario);

        return response()->json($this->serializar($user, detalhado: true));
    }

    public function update(AtualizarUsuarioRequest $request, int $usuario): JsonResponse
    {
        $user  = User::query()->findOrFail($usuario);
        $dados = $request->validated();

        if (isset($dados['role'])) {
            $user->syncRoles([$dados['role']]);
            unset($dados['role']);
        }

        if (! empty($dados)) {
            $user->update($dados);
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
