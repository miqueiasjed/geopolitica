<?php

namespace App\Services;

use App\Models\RelatorioIa;
use App\Models\UsoRelatorio;
use App\Models\User;
use App\Services\Ai\AiProviderFactory;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class RelatorioIaService
{
    private const MAX_TOKENS = 4096;

    public function __construct(private PlanoService $planoService)
    {
    }

    public function verificarLimite(User $usuario): void
    {
        if ($usuario->hasRole('admin')) {
            return;
        }

        $slugPlano = $usuario->assinante?->plano ?? 'essencial';
        $limite    = $this->planoService->limiteInteiro($slugPlano, 'relatorio_mensal_limite');

        if ($limite === null) {
            return; // ilimitado
        }

        $mesAtual = now()->timezone('America/Sao_Paulo')->format('Y-m');

        $uso = UsoRelatorio::where('user_id', $usuario->id)
            ->where('month_key', $mesAtual)
            ->first();

        $contagem = $uso ? $uso->count : 0;

        if ($contagem >= $limite) {
            throw new TooManyRequestsHttpException(
                null,
                "Limite de {$limite} relatórios mensais atingido. Faça upgrade para continuar.",
            );
        }
    }

    public function coletarContexto(string $topico, string $escopo = ''): array
    {
        $termoBusca = trim("{$topico} {$escopo}");
        $fontes     = [];
        $textos     = [];

        try {
            $conteudos = $this->buscarConteudos($termoBusca);
            $eventos   = $this->buscarEventos($termoBusca);
            $paises    = $this->buscarPerfisPaises($termoBusca);
            $crises    = $this->buscarCrisesHistoricas($termoBusca);

            foreach ($conteudos as $item) {
                $fontes[]  = $item['titulo'];
                $textos[]  = $item['texto'];
            }

            foreach ($eventos as $item) {
                $fontes[]  = $item['titulo'];
                $textos[]  = $item['texto'];
            }

            foreach ($paises as $item) {
                $fontes[]  = $item['titulo'];
                $textos[]  = $item['texto'];
            }

            foreach ($crises as $item) {
                $fontes[]  = $item['titulo'];
                $textos[]  = $item['texto'];
            }
        } catch (\Throwable $excecao) {
            Log::warning('RelatorioIaService: erro ao coletar contexto', [
                'erro' => $excecao->getMessage(),
            ]);
        }

        $textoContexto = implode("\n\n---\n\n", $textos);

        return [
            'texto'  => $textoContexto,
            'fontes' => $fontes,
        ];
    }

    public function gerarComStreaming(User $usuario, string $topico, string $escopo, callable $aoReceberToken): RelatorioIa
    {
        $this->verificarLimite($usuario);

        $contexto = $this->coletarContexto($topico, $escopo);

        $relatorio = RelatorioIa::create([
            'id'          => Str::uuid()->toString(),
            'user_id'     => $usuario->id,
            'title'       => mb_substr($topico, 0, 255),
            'topic'       => $topico,
            'scope'       => $escopo,
            'body'        => '',
            'sources_used' => $contexto['fontes'],
            'word_count'  => 0,
            'status'      => 'generating',
        ]);

        $systemPrompt = $this->montarSystemPrompt($contexto['texto']);

        $mensagens = [
            [
                'role'    => 'user',
                'content' => "Gere um relatório analítico sobre: {$topico}" . ($escopo !== '' ? "\n\nEscopo adicional: {$escopo}" : ''),
            ],
        ];

        try {
            $corpoCompleto = AiProviderFactory::make()->stream(
                system:    $systemPrompt,
                messages:  $mensagens,
                maxTokens: self::MAX_TOKENS,
                onToken:   $aoReceberToken,
            );

            $tituloExtraido = $this->extrairTitulo($corpoCompleto, $topico);
            $contagem       = str_word_count(strip_tags($corpoCompleto));

            $relatorio->update([
                'title'       => $tituloExtraido,
                'body'        => $corpoCompleto,
                'word_count'  => $contagem,
                'sources_used' => $contexto['fontes'],
                'status'      => 'completed',
            ]);
        } catch (\Throwable $excecao) {
            Log::error('RelatorioIaService: erro ao gerar relatório', [
                'relatorio_id' => $relatorio->id,
                'erro'         => $excecao->getMessage(),
            ]);

            $relatorio->update(['status' => 'failed']);

            throw $excecao;
        }

        $this->incrementarUso($usuario);

        return $relatorio->fresh();
    }

    public function buscarRelatorio(string $id, int $userId): RelatorioIa
    {
        return RelatorioIa::where('id', $id)->where('user_id', $userId)->firstOrFail();
    }

    public function listarRelatorios(int $userId): Collection
    {
        return RelatorioIa::where('user_id', $userId)->orderByDesc('created_at')->get();
    }

    // -------------------------------------------------------------------------
    // Métodos privados auxiliares
    // -------------------------------------------------------------------------

    private function montarSystemPrompt(string $contexto): string
    {
        return <<<PROMPT
Você é um analista geopolítico sênior. Gere um relatório analítico formal sobre o tema fornecido,
baseado EXCLUSIVAMENTE no contexto abaixo.

ESTRUTURA OBRIGATÓRIA (use estes títulos exatos em Markdown):
# [Título do relatório]
## Contexto geopolítico
## Dinâmicas em curso
## Implicações econômicas para o Brasil
## Cenários e riscos
## O que monitorar

REGRAS:
- Tom: analítico, direto, sem eufemismos
- Extensão: 800 a 1.200 palavras no total
- Cite as fontes como [Fonte: título] ao longo do texto
- Não faça recomendações de investimento
- Se o contexto for insuficiente para alguma seção, indique explicitamente

CONTEXTO DISPONÍVEL:
{$contexto}
PROMPT;
    }

    private function extrairTitulo(string $corpo, string $topicoPadrao): string
    {
        if (preg_match('/^#\s+(.+)$/m', $corpo, $matches)) {
            return mb_substr(trim($matches[1]), 0, 255);
        }

        return mb_substr($topicoPadrao, 0, 255);
    }

    private function incrementarUso(User $usuario): void
    {
        $mesAtual = now()->timezone('America/Sao_Paulo')->format('Y-m');

        $uso = UsoRelatorio::firstOrCreate(
            ['user_id' => $usuario->id, 'month_key' => $mesAtual],
            ['count' => 0],
        );

        $uso->increment('count');
    }

    // -------------------------------------------------------------------------
    // Buscas nas fontes (replicando a lógica do ChatRecuperacaoService)
    // -------------------------------------------------------------------------

    /**
     * Busca até 5 conteúdos relevantes para o tópico.
     *
     * @return array<int, array{titulo: string, texto: string}>
     */
    private function buscarConteudos(string $termo): array
    {
        try {
            $linhas = DB::select(
                'SELECT titulo, corpo FROM conteudos
                 WHERE MATCH(titulo, corpo) AGAINST(? IN BOOLEAN MODE)
                 ORDER BY publicado_em DESC
                 LIMIT 5',
                [$termo],
            );
        } catch (\Throwable) {
            return [];
        }

        $resultado = [];
        $indice    = 1;

        foreach ($linhas as $linha) {
            $excerpt     = mb_substr((string) ($linha->corpo ?? ''), 0, 500);
            $resultado[] = [
                'titulo' => "[Fonte {$indice} — Biblioteca — {$linha->titulo}]",
                'texto'  => "[Fonte {$indice} — Biblioteca — {$linha->titulo}]\n{$excerpt}",
            ];
            $indice++;
        }

        return $resultado;
    }

    /**
     * Busca até 5 eventos relevantes para o tópico.
     *
     * @return array<int, array{titulo: string, texto: string}>
     */
    private function buscarEventos(string $termo): array
    {
        try {
            $linhas = DB::select(
                'SELECT titulo, resumo, impact_label FROM events
                 WHERE MATCH(titulo, resumo) AGAINST(? IN BOOLEAN MODE)
                 ORDER BY created_at DESC
                 LIMIT 5',
                [$termo],
            );
        } catch (\Throwable) {
            return [];
        }

        $resultado = [];
        $indice    = 1;

        foreach ($linhas as $linha) {
            $nivel       = $linha->impact_label ?? 'desconhecido';
            $excerpt     = mb_substr((string) ($linha->resumo ?? ''), 0, 400);
            $resultado[] = [
                'titulo' => "[Fonte {$indice} — Evento ({$nivel}) — {$linha->titulo}]",
                'texto'  => "[Fonte {$indice} — Evento ({$nivel}) — {$linha->titulo}]\n{$excerpt}",
            ];
            $indice++;
        }

        return $resultado;
    }

    /**
     * Busca até 3 perfis de países relevantes para o tópico.
     *
     * @return array<int, array{titulo: string, texto: string}>
     */
    private function buscarPerfisPaises(string $termo): array
    {
        try {
            $linhas = DB::select(
                'SELECT nome_pt, contexto_geopolitico FROM perfis_paises
                 WHERE MATCH(contexto_geopolitico, analise_lideranca) AGAINST(? IN BOOLEAN MODE)
                 AND contexto_geopolitico IS NOT NULL
                 LIMIT 3',
                [$termo],
            );
        } catch (\Throwable) {
            return [];
        }

        $resultado = [];
        $indice    = 1;

        foreach ($linhas as $linha) {
            $excerpt     = mb_substr((string) ($linha->contexto_geopolitico ?? ''), 0, 400);
            $resultado[] = [
                'titulo' => "[Fonte {$indice} — País — {$linha->nome_pt}]",
                'texto'  => "[Fonte {$indice} — País — {$linha->nome_pt}]\n{$excerpt}",
            ];
            $indice++;
        }

        return $resultado;
    }

    /**
     * Busca até 3 crises históricas relevantes para o tópico.
     *
     * @return array<int, array{titulo: string, texto: string}>
     */
    private function buscarCrisesHistoricas(string $termo): array
    {
        try {
            $linhas = DB::select(
                'SELECT titulo, contexto_geopolitico FROM crises_historicas
                 WHERE MATCH(titulo, contexto_geopolitico) AGAINST(? IN BOOLEAN MODE)
                 LIMIT 3',
                [$termo],
            );
        } catch (\Throwable) {
            return [];
        }

        $resultado = [];
        $indice    = 1;

        foreach ($linhas as $linha) {
            $excerpt     = mb_substr((string) ($linha->contexto_geopolitico ?? ''), 0, 400);
            $resultado[] = [
                'titulo' => "[Fonte {$indice} — Crise Histórica — {$linha->titulo}]",
                'texto'  => "[Fonte {$indice} — Crise Histórica — {$linha->titulo}]\n{$excerpt}",
            ];
            $indice++;
        }

        return $resultado;
    }
}
