<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AceitarConviteRequest;
use App\Http\Requests\ConvidarMembroRequest;
use App\Models\MembroB2B;
use App\Services\MembroB2BService;
use Illuminate\Http\JsonResponse;

class EmpresaController extends Controller
{
    public function __construct(
        private readonly MembroB2BService $membroService,
    ) {}

    public function info(): JsonResponse
    {
        $empresa = app('tenant');

        return response()->json([
            'nome'       => $empresa->nome,
            'logo_url'   => $empresa->logo_url,
            'subdominio' => $empresa->subdominio,
        ]);
    }

    public function equipe(): JsonResponse
    {
        $empresa = app('tenant');

        $membros = $empresa->membros()
            ->with('usuario:id,name')
            ->get()
            ->map(fn ($membro) => [
                'id'           => $membro->id,
                'convite_email' => $membro->convite_email,
                'role_b2b'     => $membro->role_b2b,
                'aceito_em'    => $membro->aceito_em,
                'usuario'      => $membro->usuario
                    ? ['name' => $membro->usuario->name]
                    : null,
            ]);

        $ativos    = $empresa->membros()->ativos()->count();
        $pendentes = $empresa->membros()->pendentes()->count();

        return response()->json([
            'membros'      => $membros,
            'contadores'   => [
                'ativos'       => $ativos,
                'pendentes'    => $pendentes,
                'max_usuarios' => $empresa->max_usuarios,
            ],
        ]);
    }

    public function convidar(ConvidarMembroRequest $request): JsonResponse
    {
        $empresa = app('tenant');

        $membro = $this->membroService->convidar(
            $empresa,
            $request->validated('email'),
            $request->validated('role_b2b'),
        );

        return response()->json([
            'id'            => $membro->id,
            'convite_email' => $membro->convite_email,
            'role_b2b'      => $membro->role_b2b,
            'aceito_em'     => $membro->aceito_em,
        ], 201);
    }

    public function removerMembro(int $membroId): JsonResponse
    {
        $empresa = app('tenant');
        $usuario = auth()->user();

        $membro = MembroB2B::query()
            ->where('id', $membroId)
            ->where('empresa_id', $empresa->id)
            ->firstOrFail();

        $ehOMesmoUsuario = $membro->user_id === $usuario->id;

        if ($ehOMesmoUsuario) {
            $totalAdmins = $empresa->membros()
                ->ativos()
                ->where('role_b2b', 'company_admin')
                ->count();

            if ($totalAdmins <= 1) {
                return response()->json([
                    'message' => 'Não é possível remover o único company_admin da empresa.',
                ], 403);
            }
        }

        $this->membroService->removerMembro($membro);

        return response()->json(null, 204);
    }

    public function aceitarConvite(AceitarConviteRequest $request, string $token): JsonResponse
    {
        $dados = [
            'nome'  => $request->validated('nome'),
            'senha' => $request->validated('password'),
        ];

        $usuario = $this->membroService->aceitarConvite($token, $dados);

        return response()->json([
            'message' => 'Convite aceito com sucesso.',
            'usuario' => [
                'id'    => $usuario->id,
                'name'  => $usuario->name,
                'email' => $usuario->email,
            ],
        ]);
    }
}
