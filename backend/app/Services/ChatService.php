<?php

namespace App\Services;

use App\Models\ChatMensagem;
use App\Models\ChatSessao;
use App\Models\User;
use App\Services\Ai\AiProviderFactory;
use Carbon\Carbon;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class ChatService
{
    private const MAX_TOKENS = 1024;

    private const HISTORICO_MAX_MENSAGENS = 10;

    public function __construct(
        private ChatRecuperacaoService $recuperacaoService,
        private PlanoService $planoService,
    ) {
    }

    public function verificarLimite(User $usuario): void
    {
        if ($usuario->hasRole('admin')) {
            return;
        }

        $slugPlano = $usuario->assinante?->plano ?? 'essencial';
        $limite    = $this->planoService->limiteInteiro($slugPlano, 'chat_diario_limite');

        if ($limite === null) {
            return; // ilimitado
        }

        $dataBrasilia = now()->timezone('America/Sao_Paulo')->format('Y-m-d');
        $chaveRedis   = "chat_limite_{$usuario->id}_{$dataBrasilia}";
        $contagem     = (int) Redis::get($chaveRedis);

        if ($contagem >= $limite) {
            throw new TooManyRequestsHttpException(
                null,
                "Limite de {$limite} perguntas/dia atingido. Faça upgrade para continuar.",
            );
        }
    }

    public function perguntar(User $usuario, string $pergunta, callable $aoReceberToken): void
    {
        $this->verificarLimite($usuario);

        $sessao = ChatSessao::obterOuCriarHoje($usuario->id);

        $historico = $sessao->mensagens()
            ->orderBy('created_at', 'desc')
            ->limit(self::HISTORICO_MAX_MENSAGENS)
            ->get()
            ->reverse()
            ->values();

        $contexto = $this->recuperacaoService->recuperarContexto($pergunta);

        $sessao->mensagens()->create([
            'role'     => 'user',
            'conteudo' => $pergunta,
        ]);

        $systemPrompt = (string) config('ai.prompts.chat_sistema');

        if ($contexto !== '') {
            $systemPrompt .= "\n\n{$contexto}";
        }

        $mensagensFormatadas = $historico->map(fn (ChatMensagem $msg) => [
            'role'    => $msg->role,
            'content' => $msg->conteudo,
        ])->toArray();

        $mensagensFormatadas[] = [
            'role'    => 'user',
            'content' => $pergunta,
        ];

        $respostaCompleta = AiProviderFactory::make()->stream(
            system:    $systemPrompt,
            messages:  $mensagensFormatadas,
            maxTokens: self::MAX_TOKENS,
            onToken:   $aoReceberToken,
        );

        if ($respostaCompleta !== '') {
            $sessao->mensagens()->create([
                'role'     => 'assistant',
                'conteudo' => $respostaCompleta,
            ]);
        }

        $sessao->increment('pergunta_count');

        $this->incrementarRedis($usuario);
    }

    private function incrementarRedis(User $usuario): void
    {
        $dataBrasilia = now()->timezone('America/Sao_Paulo')->format('Y-m-d');
        $chaveRedis   = "chat_limite_{$usuario->id}_{$dataBrasilia}";

        $ttlSegundos = (int) Carbon::tomorrow()
            ->timezone('America/Sao_Paulo')
            ->startOfDay()
            ->diffInSeconds(now());

        $contagem = Redis::incr($chaveRedis);

        if ($contagem === 1) {
            Redis::expire($chaveRedis, $ttlSegundos);
        }
    }
}
