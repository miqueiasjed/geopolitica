<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatSessao;
use App\Services\ChatService;
use App\Services\PlanoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatHistoricoController extends Controller
{
    public function __construct(
        private readonly PlanoService $planoService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $usuario   = auth()->user();
        $slugPlano = $usuario->assinante?->plano ?? 'essencial';

        $limite = $usuario->hasRole('admin')
            ? null
            : $this->planoService->limiteInteiro($slugPlano, 'chat_diario_limite');

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
