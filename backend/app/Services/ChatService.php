<?php

namespace App\Services;

use Anthropic\Client;
use Anthropic\Messages\RawContentBlockDeltaEvent;
use Anthropic\Messages\TextDelta;
use App\Models\ChatMensagem;
use App\Models\ChatSessao;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class ChatService
{
    private const MODELO = 'claude-sonnet-4-5';

    private const MAX_TOKENS = 1024;

    private const LIMITES_POR_PLANO = [
        'essencial' => 5,
        'pro'       => 20,
    ];

    private const PLANOS_SEM_LIMITE = ['reservado', 'admin'];

    private const HISTORICO_MAX_MENSAGENS = 10;

    public function __construct(private ChatRecuperacaoService $recuperacaoService)
    {
    }

    public function verificarLimite(User $usuario): void
    {
        $plano = $usuario->getRoleNames()->first() ?? 'essencial';

        if (in_array($plano, self::PLANOS_SEM_LIMITE, true)) {
            return;
        }

        $limite = self::LIMITES_POR_PLANO[$plano] ?? self::LIMITES_POR_PLANO['essencial'];

        $dataBrasilia = now()->timezone('America/Sao_Paulo')->format('Y-m-d');
        $chaveRedis   = "chat_limite_{$usuario->id}_{$dataBrasilia}";

        $contagem = (int) Redis::get($chaveRedis);

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

        $systemPrompt = "Você é um analista geopolítico especializado. Responda em português brasileiro de forma objetiva e fundamentada. Use apenas o contexto fornecido quando relevante.";

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

        $cliente  = new Client(apiKey: config('claude.api_key'));
        $stream   = $cliente->messages->createStream(
            maxTokens: self::MAX_TOKENS,
            messages:  $mensagensFormatadas,
            model:     self::MODELO,
            system:    $systemPrompt,
        );

        $respostaCompleta = '';

        foreach ($stream as $evento) {
            if (
                $evento instanceof RawContentBlockDeltaEvent &&
                $evento->delta instanceof TextDelta
            ) {
                $token            = $evento->delta->text;
                $respostaCompleta .= $token;
                $aoReceberToken($token);
            }
        }

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
