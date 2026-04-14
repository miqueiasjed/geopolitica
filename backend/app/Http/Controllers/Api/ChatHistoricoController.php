<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatSessao;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatHistoricoController extends Controller
{
    private const LIMITES_POR_PLANO = [
        'essencial' => 5,
        'pro'       => 20,
    ];

    private const LIMITE_SEM_RESTRICAO = null;

    private const PLANOS_SEM_LIMITE = ['reservado', 'admin'];

    public function index(Request $request): JsonResponse
    {
        $usuario = auth()->user();
        $plano   = $usuario->getRoleNames()->first() ?? 'essencial';

        $limite = in_array($plano, self::PLANOS_SEM_LIMITE, true)
            ? self::LIMITE_SEM_RESTRICAO
            : (self::LIMITES_POR_PLANO[$plano] ?? self::LIMITES_POR_PLANO['essencial']);

        $sessao = ChatSessao::where('user_id', $usuario->id)
            ->hoje()
            ->first();

        if (! $sessao) {
            return response()->json([
                'mensagens'      => [],
                'pergunta_count' => 0,
                'limite'         => $limite,
            ]);
        }

        $mensagens = $sessao->mensagens()
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($msg) => [
                'role'       => $msg->role,
                'conteudo'   => $msg->conteudo,
                'created_at' => $msg->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'mensagens'      => $mensagens,
            'pergunta_count' => $sessao->pergunta_count,
            'limite'         => $limite,
        ]);
    }
}
