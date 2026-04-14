# PRD — Módulo 09: Chat com os Briefings
**Projeto:** Geopolítica para Investidores  
**Versão:** 2.0 (Stack Laravel + React)  
**Data:** Abril 2026  
**Depende de:** Módulos 00, 01, 03, 06 e 07 concluídos  
**Prazo MVP:** 4 dias de desenvolvimento  
**Custo Estimado:** R$ 8.000 – R$ 18.000  
**Custo Mensal Adicional:** R$ 100 – R$ 400 (Claude API por volume de uso)

---

## 1. Visão Geral

O Módulo 09 é o Chat com os Briefings — uma interface de conversa onde o assinante faz perguntas em linguagem natural e a IA responde com base no conteúdo publicado no canal.

O sistema consulta simultaneamente quatro fontes:
1. **Biblioteca de conteúdo** (M03) — briefings, mapas e edições de A Tese
2. **Feed de eventos** (M01) — eventos geopolíticos recentes
3. **Perfis de países** (M06) — contexto geopolítico e liderança por país
4. **Crises históricas** (M07) — crises com padrões, causas e impactos

A interface é um chat com histórico persistente por sessão diária. O assinante pode perguntar: *"o que o canal publicou sobre a guerra do Irã?"*, *"quais crises históricas têm padrão similar ao que está acontecendo no Oriente Médio hoje?"* ou *"como a eleição alemã pode afetar o agro brasileiro?"*. A IA busca o contexto relevante nas quatro fontes e responde com referências diretas ao conteúdo do canal.

**Limites de perguntas por plano por dia:**

| Plano | Limite diário |
|---|---|
| `assinante_essencial` | 5 perguntas |
| `assinante_pro` | 20 perguntas |
| `assinante_reservado` | Ilimitado |

O limite reinicia à meia-noite (horário de Brasília). Ao atingir o limite, o assinante vê uma mensagem com opção de upgrade.

**Pré-requisitos obrigatórios:**
- M01 — tabela `eventos` com índice FULLTEXT em `titulo` e `analise_ia`
- M03 — tabela `conteudos` com índice FULLTEXT em `titulo` e `corpo`
- M06 — tabela `perfis_paises` com campos `contexto_geopolitico` e `analise_lideranca`
- M07 — tabela `crises_historicas` com campos `titulo`, `ano`, `contexto_geopolitico`

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend framework | Laravel 13 |
| Autenticação | Laravel Sanctum |
| Autorização | Spatie Laravel Permission |
| Banco de dados | MySQL 8.0 (FULLTEXT Search) |
| Cache / contagem de uso | Redis |
| IA (geração de resposta) | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Streaming | Server-Sent Events (SSE) via `StreamedResponse` do Laravel |
| Frontend framework | React 19 + Vite + TypeScript |
| Estilo | TailwindCSS |
| Estado servidor | TanStack React Query v5 |
| Roteamento SPA | React Router v7 |

---

## 3. Dependências de Outros Módulos

| Módulo | O que é necessário |
|---|---|
| M00 | `auth:sanctum` + `assinante.ativo` + `User::planoAtual()` |
| M01 | Tabela `eventos` com índice FULLTEXT em `titulo, analise_ia` |
| M03 | Tabela `conteudos` com índice FULLTEXT em `titulo, corpo` e campo `tipo` |
| M06 | Tabela `perfis_paises` com `contexto_geopolitico`, `analise_lideranca` |
| M07 | Tabela `crises_historicas` com `titulo`, `ano`, `contexto_geopolitico` |

---

## 4. Prazo MVP e Custo Estimado

| Item | Detalhe |
|---|---|
| Prazo MVP | 4 dias |
| Custo desenvolvimento | R$ 8.000 – R$ 18.000 |
| Custo mensal adicional | R$ 100 – R$ 400 (Claude API, proporcional ao uso) |
| Dia 1 | Migrations, Models, `ChatRecuperacaoService` (4 fontes FULLTEXT) |
| Dia 2 | `ChatService` com streaming SSE, verificação de limite, salvamento do histórico |
| Dia 3 | Frontend: `ChatInterface`, `ChatMensagem`, `ChatFontes`, streaming visual |
| Dia 4 | `ChatLimiteBanner`, Scheduler de limpeza, testes por plano, ajustes finais |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── ChatController.php              ← enviar mensagem (SSE), histórico, uso
│   └── Requests/
│       └── EnviarMensagemRequest.php       ← validar mensagem
├── Models/
│   ├── ChatSessao.php                      ← sessão diária por usuário (mensagens em JSON)
│   └── ChatUso.php                         ← contador de perguntas por dia
└── Services/
    ├── ChatService.php                     ← orquestra retrieval + Claude API + persistência
    └── ChatRecuperacaoService.php          ← busca contexto nas 4 fontes (RAG simples)

routes/
└── api.php

database/
└── migrations/
    ├── xxxx_create_chat_sessoes_table.php
    └── xxxx_create_chat_uso_table.php

config/
└── services.php                            ← ANTHROPIC_API_KEY + model
```

---

### 5.2 Models e Migrations

#### Migration: `chat_sessoes`

Uma sessão por assinante por dia. O histórico de mensagens é armazenado como JSON. Reinicia automaticamente no dia seguinte com nova `data_chave`.

```php
// database/migrations/xxxx_create_chat_sessoes_table.php
Schema::create('chat_sessoes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')
          ->constrained('users')
          ->cascadeOnDelete();
    $table->json('mensagens')
          ->default('[]')
          ->comment('Array de objetos: {papel, conteudo, fontes, criado_em}');
    $table->date('data_chave')
          ->comment('Uma sessão por usuário por dia (timezone BRT)');
    $table->timestamps();

    $table->unique(['user_id', 'data_chave']);
    $table->index(['user_id', 'created_at']);
});
```

**Schema completo da tabela `chat_sessoes`:**

| Coluna | Tipo MySQL | Nullable | Default | Índice |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | NÃO | — | PRIMARY KEY |
| `user_id` | BIGINT UNSIGNED | NÃO | — | FK → users.id CASCADE |
| `mensagens` | JSON | NÃO | `'[]'` | — |
| `data_chave` | DATE | NÃO | — | UNIQUE com user_id |
| `created_at` | TIMESTAMP | SIM | NULL | INDEX com user_id |
| `updated_at` | TIMESTAMP | SIM | NULL | — |

---

#### Migration: `chat_uso`

Controla o número de perguntas por assinante por dia.

```php
// database/migrations/xxxx_create_chat_uso_table.php
Schema::create('chat_uso', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')
          ->constrained('users')
          ->cascadeOnDelete();
    $table->date('data_chave');
    $table->unsignedSmallInteger('contagem')->default(0);
    $table->timestamps();

    $table->unique(['user_id', 'data_chave']);
    $table->index(['user_id', 'data_chave']);
});
```

**Schema completo da tabela `chat_uso`:**

| Coluna | Tipo MySQL | Nullable | Default | Índice |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | NÃO | — | PRIMARY KEY |
| `user_id` | BIGINT UNSIGNED | NÃO | — | FK → users.id CASCADE |
| `data_chave` | DATE | NÃO | — | UNIQUE com user_id |
| `contagem` | SMALLINT UNSIGNED | NÃO | `0` | — |
| `created_at` | TIMESTAMP | SIM | NULL | — |
| `updated_at` | TIMESTAMP | SIM | NULL | — |

---

#### Model: `ChatSessao`

```php
// app/Models/ChatSessao.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatSessao extends Model
{
    protected $table = 'chat_sessoes';

    protected $fillable = ['user_id', 'mensagens', 'data_chave'];

    protected $casts = [
        'mensagens'  => 'array',
        'data_chave' => 'date',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Busca ou cria a sessão do dia para o usuário.
     * "Hoje" é calculado no timezone de Brasília.
     */
    public static function doUsuarioHoje(int $userId): self
    {
        $hoje = now()->timezone('America/Sao_Paulo')->toDateString();

        return self::firstOrCreate(
            ['user_id' => $userId, 'data_chave' => $hoje],
            ['mensagens' => []]
        );
    }
}
```

#### Model: `ChatUso`

```php
// app/Models/ChatUso.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ChatUso extends Model
{
    protected $table = 'chat_uso';

    protected $fillable = ['user_id', 'data_chave', 'contagem'];

    protected $casts = ['data_chave' => 'date'];

    public static function contagemHoje(int $userId): int
    {
        $hoje = now()->timezone('America/Sao_Paulo')->toDateString();

        return self::where('user_id', $userId)
                   ->where('data_chave', $hoje)
                   ->value('contagem') ?? 0;
    }

    /**
     * Incremento atômico usando INSERT ... ON DUPLICATE KEY UPDATE.
     * Evita race conditions em acessos concorrentes.
     */
    public static function incrementar(int $userId): void
    {
        $hoje = now()->timezone('America/Sao_Paulo')->toDateString();
        $agora = now()->toDateTimeString();

        DB::statement(
            'INSERT INTO chat_uso (user_id, data_chave, contagem, created_at, updated_at)
             VALUES (?, ?, 1, ?, ?)
             ON DUPLICATE KEY UPDATE contagem = contagem + 1, updated_at = ?',
            [$userId, $hoje, $agora, $agora, $agora]
        );
    }
}
```

---

### 5.3 Services

#### `ChatRecuperacaoService`

**Responsabilidades:**
- Buscar conteúdo relevante nas 4 fontes via FULLTEXT do MySQL
- Filtrar por tipos permitidos ao plano do assinante
- Limitar a no máximo 8 fontes combinadas para não exceder o contexto da IA
- Construir o bloco de texto de contexto formatado para o prompt do sistema

```php
// app/Services/ChatRecuperacaoService.php
namespace App\Services;

use Illuminate\Support\Facades\DB;

class ChatRecuperacaoService
{
    const TIPOS_POR_PLANO = [
        'essencial'  => ['briefing'],
        'pro'        => ['briefing', 'mapa', 'tese'],
        'reservado'  => ['briefing', 'mapa', 'tese'],
        'admin'      => ['briefing', 'mapa', 'tese'],
    ];

    /**
     * Recupera contexto relevante para a pergunta nas 4 fontes.
     * Retorna ['contexto' => string, 'fontes' => array].
     */
    public function recuperar(string $pergunta, string $plano): array
    {
        $tiposPermitidos = self::TIPOS_POR_PLANO[$plano] ?? ['briefing'];

        // Busca sequencial (MySQL não suporta queries paralelas por conexão)
        $fontes = array_merge(
            $this->buscarConteudos($pergunta, $tiposPermitidos),
            $this->buscarEventos($pergunta),
            $this->buscarPaises($pergunta),
            $this->buscarCrises($pergunta),
        );

        // Máximo 8 fontes para não exceder o contexto da IA (~2.000 tokens)
        $fontes = array_slice($fontes, 0, 8);

        // Construir bloco de contexto para o prompt
        $blocos = [];
        foreach ($fontes as $i => $fonte) {
            $num  = $i + 1;
            $tipo = strtoupper($fonte['tipo']);
            $blocos[] = "[FONTE {$num} — {$tipo}]\nTítulo: {$fonte['titulo']}\nConteúdo: {$fonte['trecho']}";
        }

        return [
            'contexto' => implode("\n\n---\n\n", $blocos),
            'fontes'   => $fontes,
        ];
    }

    /**
     * Busca na Biblioteca (M03) — FULLTEXT em titulo + corpo.
     */
    private function buscarConteudos(string $pergunta, array $tipos): array
    {
        $termos = $this->prepararTermosFts($pergunta);

        $resultados = DB::table('conteudos')
            ->select('id', 'titulo', 'slug', 'tipo', 'resumo', 'corpo')
            ->where('publicado', true)
            ->whereIn('tipo', $tipos)
            ->whereRaw('MATCH(titulo, corpo) AGAINST(? IN BOOLEAN MODE)', [$termos])
            ->orderByRaw('MATCH(titulo, corpo) AGAINST(? IN BOOLEAN MODE) DESC', [$termos])
            ->limit(3)
            ->get();

        return $resultados->map(fn($r) => [
            'tipo'   => 'conteudo',
            'id'     => (string) $r->id,
            'titulo' => $r->titulo,
            'trecho' => $r->resumo ?: mb_substr(strip_tags($r->corpo ?? ''), 0, 400),
            'slug'   => $r->slug,
        ])->toArray();
    }

    /**
     * Busca no Feed de Eventos (M01) — últimos 90 dias, FULLTEXT em titulo + analise_ia.
     */
    private function buscarEventos(string $pergunta): array
    {
        $termos = $this->prepararTermosFts($pergunta);

        $resultados = DB::table('eventos')
            ->select('id', 'titulo', 'analise_ia', 'url_fonte', 'publicado_em')
            ->where('ativo', true)
            ->where('publicado_em', '>=', now()->subDays(90))
            ->whereRaw('MATCH(titulo, analise_ia) AGAINST(? IN BOOLEAN MODE)', [$termos])
            ->orderBy('pontuacao_impacto', 'desc')
            ->limit(2)
            ->get();

        return $resultados->map(fn($r) => [
            'tipo'   => 'evento',
            'id'     => (string) $r->id,
            'titulo' => $r->titulo,
            'trecho' => $r->analise_ia ?? '',
            'url'    => $r->url_fonte,
        ])->toArray();
    }

    /**
     * Busca em Perfis de Países (M06) — LIKE em nome e contexto.
     */
    private function buscarPaises(string $pergunta): array
    {
        $resultados = DB::table('perfis_paises')
            ->select('codigo_pais', 'nome_pais_pt', 'contexto_geopolitico')
            ->where(function ($q) use ($pergunta) {
                $q->where('nome_pais_pt', 'LIKE', "%{$pergunta}%")
                  ->orWhere('contexto_geopolitico', 'LIKE', "%{$pergunta}%");
            })
            ->limit(2)
            ->get();

        return $resultados->map(fn($r) => [
            'tipo'   => 'pais',
            'id'     => $r->codigo_pais,
            'titulo' => "Perfil: {$r->nome_pais_pt}",
            'trecho' => mb_substr($r->contexto_geopolitico ?? '', 0, 400),
            'slug'   => "/dashboard/paises/{$r->codigo_pais}",
        ])->toArray();
    }

    /**
     * Busca em Crises Históricas (M07) — LIKE em título e contexto.
     */
    private function buscarCrises(string $pergunta): array
    {
        $resultados = DB::table('crises_historicas')
            ->select('id', 'titulo', 'ano', 'contexto_geopolitico')
            ->where(function ($q) use ($pergunta) {
                $q->where('titulo', 'LIKE', "%{$pergunta}%")
                  ->orWhere('contexto_geopolitico', 'LIKE', "%{$pergunta}%");
            })
            ->orderBy('ano', 'desc')
            ->limit(2)
            ->get();

        return $resultados->map(fn($r) => [
            'tipo'   => 'crise',
            'id'     => (string) $r->id,
            'titulo' => "{$r->titulo} ({$r->ano})",
            'trecho' => mb_substr($r->contexto_geopolitico ?? '', 0, 400),
        ])->toArray();
    }

    /**
     * Prepara string para FULLTEXT BOOLEAN MODE do MySQL.
     * Remove operadores especiais e adiciona wildcard por palavra.
     */
    private function prepararTermosFts(string $texto): string
    {
        $texto   = preg_replace('/[+\-><()*~"@]+/', ' ', $texto);
        $palavras = array_filter(array_map('trim', explode(' ', $texto)));
        return implode(' ', array_map(fn($p) => "+{$p}*", $palavras));
    }
}
```

---

#### `ChatService`

**Responsabilidades:**
- Verificar o limite diário do plano antes de processar
- Carregar o histórico da sessão do dia
- Chamar `ChatRecuperacaoService` para obter contexto relevante
- Montar o system prompt com as regras editoriais do canal
- Executar streaming via Claude API e entregar SSE ao frontend
- Salvar a troca de mensagens no histórico da sessão
- Incrementar o contador de uso do dia

```php
// app/Services/ChatService.php
namespace App\Services;

use App\Models\ChatSessao;
use App\Models\ChatUso;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatService
{
    const LIMITES_POR_PLANO = [
        'essencial'  => 5,
        'pro'        => 20,
        'reservado'  => PHP_INT_MAX,
        'admin'      => PHP_INT_MAX,
    ];

    public function __construct(
        private readonly ChatRecuperacaoService $recuperacao
    ) {}

    /**
     * Verifica se o usuário atingiu o limite diário.
     * Retorna array com detalhes se atingiu, ou null se pode prosseguir.
     */
    public function verificarLimite(User $usuario): ?array
    {
        $plano  = $usuario->planoAtual();
        $limite = self::LIMITES_POR_PLANO[$plano] ?? 5;

        if ($limite === PHP_INT_MAX) {
            return null;
        }

        $usado = ChatUso::contagemHoje($usuario->id);

        if ($usado >= $limite) {
            return [
                'plano'    => $plano,
                'limite'   => $limite,
                'usado'    => $usado,
                'mensagem' => "Você atingiu o limite de {$limite} perguntas por dia do plano {$plano}.",
            ];
        }

        return null;
    }

    /**
     * Retorna histórico da sessão do dia.
     */
    public function historicoDoDia(User $usuario): array
    {
        return ChatSessao::doUsuarioHoje($usuario->id)->mensagens ?? [];
    }

    /**
     * Retorna estatísticas de uso do dia atual.
     */
    public function usoDoDia(User $usuario): array
    {
        $plano  = $usuario->planoAtual();
        $limite = self::LIMITES_POR_PLANO[$plano] ?? 5;
        $usado  = ChatUso::contagemHoje($usuario->id);
        $ilimitado = $limite === PHP_INT_MAX;

        return [
            'plano'     => $plano,
            'usado'     => $usado,
            'limite'    => $ilimitado ? null : $limite,
            'restante'  => $ilimitado ? null : max(0, $limite - $usado),
            'ilimitado' => $ilimitado,
        ];
    }

    /**
     * Processa a mensagem do usuário e retorna StreamedResponse (SSE).
     */
    public function processarComStreaming(User $usuario, string $mensagem): StreamedResponse
    {
        $plano    = $usuario->planoAtual();
        $sessao   = ChatSessao::doUsuarioHoje($usuario->id);
        $historico = array_slice($sessao->mensagens ?? [], -10); // últimas 10 mensagens

        // Recuperar contexto das 4 fontes
        ['contexto' => $contexto, 'fontes' => $fontes] =
            $this->recuperacao->recuperar($mensagem, $plano);

        // Montar mensagens no formato da Claude API
        $mensagensApi = array_map(fn($m) => [
            'role'    => $m['papel'] === 'user' ? 'user' : 'assistant',
            'content' => $m['conteudo'],
        ], $historico);
        $mensagensApi[] = ['role' => 'user', 'content' => $mensagem];

        $promptSistema = $this->montarPromptSistema($contexto);

        return new StreamedResponse(
            function () use ($usuario, $sessao, $historico, $mensagensApi, $promptSistema, $mensagem, $fontes) {
                $respostaCompleta = '';

                try {
                    $client = \Anthropic::client(config('services.anthropic.key'));

                    $stream = $client->messages()->createStreamed([
                        'model'      => config('services.anthropic.model', 'claude-sonnet-4-20250514'),
                        'max_tokens' => 700,
                        'system'     => $promptSistema,
                        'messages'   => $mensagensApi,
                    ]);

                    foreach ($stream as $evento) {
                        if (isset($evento->delta->type)
                            && $evento->delta->type === 'text_delta') {
                            $texto = $evento->delta->text;
                            $respostaCompleta .= $texto;
                            $this->emitirEvento(['texto' => $texto]);
                        }
                    }

                    // Emitir fontes ao final
                    $this->emitirEvento(['fontes' => $fontes, 'concluido' => true]);

                    // Salvar no histórico
                    $novasMensagens = array_merge($historico, [
                        ['papel' => 'user',      'conteudo' => $mensagem,         'criado_em' => now()->toIso8601String()],
                        ['papel' => 'assistant', 'conteudo' => $respostaCompleta, 'fontes' => $fontes, 'criado_em' => now()->toIso8601String()],
                    ]);

                    $sessao->update(['mensagens' => $novasMensagens]);
                    ChatUso::incrementar($usuario->id);

                } catch (\Exception $e) {
                    Log::error('ChatService::processarComStreaming', [
                        'user_id' => $usuario->id,
                        'erro'    => $e->getMessage(),
                    ]);
                    $this->emitirEvento([
                        'erro'      => 'Erro ao processar a resposta. Tente novamente.',
                        'concluido' => true,
                    ]);
                }
            },
            200,
            [
                'Content-Type'       => 'text/event-stream',
                'Cache-Control'      => 'no-cache, no-store',
                'X-Accel-Buffering'  => 'no', // desativa buffer do Nginx para SSE
                'Connection'         => 'keep-alive',
            ]
        );
    }

    private function montarPromptSistema(string $contexto): string
    {
        $contextoFinal = $contexto ?: 'Nenhum conteúdo relevante encontrado para esta pergunta.';

        return <<<PROMPT
Você é o assistente de análise geopolítica do canal "Geopolítica para Investidores".
Responda às perguntas do assinante com base EXCLUSIVAMENTE no conteúdo fornecido abaixo.

REGRAS OBRIGATÓRIAS:
1. Baseie cada afirmação no conteúdo fornecido. Se a informação não estiver no contexto,
   diga explicitamente que não encontrou essa informação no arquivo do canal.
2. NÃO faça recomendações de investimento, compra ou venda de ativos.
3. Tom direto, analítico, sem introduções genéricas ou floreios desnecessários.
4. Quando citar um briefing ou análise específica, mencione o título.
5. Máximo de 400 palavras por resposta.

CONTEÚDO DO CANAL DISPONÍVEL:
{$contextoFinal}
PROMPT;
    }

    private function emitirEvento(array $dados): void
    {
        echo 'data: ' . json_encode($dados) . "\n\n";
        if (ob_get_level() > 0) ob_flush();
        flush();
    }
}
```

---

### 5.4 FormRequests

```php
// app/Http/Requests/EnviarMensagemRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnviarMensagemRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'mensagem' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'mensagem.required' => 'A mensagem não pode estar vazia.',
            'mensagem.min'      => 'A mensagem deve ter pelo menos 3 caracteres.',
            'mensagem.max'      => 'A mensagem não pode ter mais de 500 caracteres.',
        ];
    }
}
```

---

### 5.5 Controllers e Rotas

#### `ChatController`

```php
// app/Http/Controllers/ChatController.php
namespace App\Http\Controllers;

use App\Http\Requests\EnviarMensagemRequest;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    public function __construct(private readonly ChatService $chatService) {}

    /**
     * POST /api/chat
     * Verifica limite, processa mensagem e retorna SSE.
     */
    public function enviar(EnviarMensagemRequest $request): StreamedResponse|JsonResponse
    {
        $usuario = $request->user();

        $limiteAtingido = $this->chatService->verificarLimite($usuario);
        if ($limiteAtingido) {
            return response()->json([
                'erro'     => 'limite_atingido',
                'mensagem' => $limiteAtingido['mensagem'],
                'plano'    => $limiteAtingido['plano'],
                'limite'   => $limiteAtingido['limite'],
            ], 429);
        }

        return $this->chatService->processarComStreaming(
            $usuario,
            $request->validated('mensagem')
        );
    }

    /**
     * GET /api/chat/historico
     * Retorna o histórico de mensagens da sessão do dia.
     */
    public function historico(Request $request): JsonResponse
    {
        return response()->json([
            'mensagens' => $this->chatService->historicoDoDia($request->user()),
        ]);
    }

    /**
     * GET /api/chat/uso
     * Retorna perguntas usadas, limite e restante no dia.
     */
    public function uso(Request $request): JsonResponse
    {
        return response()->json(
            $this->chatService->usoDoDia($request->user())
        );
    }
}
```

#### Adição ao `routes/api.php`

```php
// Dentro do grupo auth:sanctum + assinante.ativo

Route::prefix('chat')->group(function () {
    Route::post('/',         [ChatController::class, 'enviar']);
    Route::get('/historico', [ChatController::class, 'historico']);
    Route::get('/uso',       [ChatController::class, 'uso']);
});
```

---

## 6. Endpoints da API

### `POST /api/chat`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/chat` |
| Middleware | `auth:sanctum`, `assinante.ativo` |
| Content-Type da resposta | `text/event-stream` |

**Body:**
```json
{ "mensagem": "O que o canal publicou sobre a guerra do Irã?" }
```

**Response 200 (Server-Sent Events — token a token):**
```
data: {"texto": "O canal publicou"}

data: {"texto": " dois briefings sobre a crise iraniana:"}

data: {"texto": " o primeiro em março de 2026..."}

data: {"fontes": [{"tipo": "conteudo", "id": "42", "titulo": "A Crise no Irã", "trecho": "Análise dos...", "slug": "a-crise-no-ira"}, {"tipo": "evento", "id": "15", "titulo": "Ataque às refinarias", "trecho": "Em 14 de abril...", "url": "https://..."}], "concluido": true}
```

**Response 429:**
```json
{
  "erro": "limite_atingido",
  "mensagem": "Você atingiu o limite de 5 perguntas por dia do plano essencial.",
  "plano": "essencial",
  "limite": 5
}
```

**Response 422:**
```json
{
  "mensagem": "Dados inválidos.",
  "errors": { "mensagem": ["A mensagem não pode estar vazia."] }
}
```

---

### `GET /api/chat/historico`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/chat/historico` |
| Middleware | `auth:sanctum`, `assinante.ativo` |

**Response 200:**
```json
{
  "mensagens": [
    { "papel": "user",      "conteudo": "O que aconteceu no Irã?",       "criado_em": "2026-04-14T10:23:00Z" },
    { "papel": "assistant", "conteudo": "Segundo o briefing 'A Crise no Irã'...", "fontes": [{"tipo": "conteudo", "titulo": "A Crise no Irã", "slug": "a-crise-no-ira"}], "criado_em": "2026-04-14T10:23:05Z" }
  ]
}
```

---

### `GET /api/chat/uso`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/chat/uso` |
| Middleware | `auth:sanctum`, `assinante.ativo` |

**Response 200 (plano `pro`):**
```json
{ "plano": "pro", "usado": 7, "limite": 20, "restante": 13, "ilimitado": false }
```

**Response 200 (plano `reservado`):**
```json
{ "plano": "reservado", "usado": 34, "limite": null, "restante": null, "ilimitado": true }
```

---

## 7. Frontend React

### 7.1 Estrutura de Arquivos

```
src/
├── pages/
│   └── Chat.tsx                       ← página /dashboard/chat
├── components/
│   └── chat/
│       ├── ChatInterface.tsx           ← container principal, lógica de streaming
│       ├── ChatMensagem.tsx            ← bolha de mensagem (user e assistant)
│       ├── ChatFontes.tsx              ← badges clicáveis por tipo de fonte
│       └── ChatLimiteBanner.tsx        ← banner quando limite é atingido
└── hooks/
    └── useChat.ts                      ← React Query: historico e uso
```

---

### 7.2 Componentes Principais

#### `ChatInterface`

```tsx
// src/components/chat/ChatInterface.tsx
import { useState, useEffect, useRef } from 'react';
import { ChatMensagem } from './ChatMensagem';
import { ChatLimiteBanner } from './ChatLimiteBanner';
import { api } from '../../services/api';

interface Mensagem {
  papel: 'user' | 'assistant';
  conteudo: string;
  fontes?: Fonte[];
  criado_em?: string;
  transmitindo?: boolean;
}

interface Fonte {
  tipo: 'conteudo' | 'evento' | 'pais' | 'crise';
  id: string;
  titulo: string;
  slug?: string;
  url?: string;
}

interface Uso {
  plano: string;
  usado: number;
  limite: number | null;
  restante: number | null;
  ilimitado: boolean;
}

export function ChatInterface() {
  const [mensagens, setMensagens]   = useState<Mensagem[]>([]);
  const [input, setInput]           = useState('');
  const [carregando, setCarregando] = useState(false);
  const [uso, setUso]               = useState<Uso | null>(null);
  const bottomRef                   = useRef<HTMLDivElement>(null);

  // Carregar histórico e uso ao montar
  useEffect(() => {
    Promise.all([
      api.get('/chat/historico').then(r => r.data),
      api.get('/chat/uso').then(r => r.data),
    ]).then(([historico, usoDia]) => {
      setMensagens(historico.mensagens ?? []);
      setUso(usoDia);
    });
  }, []);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function enviarMensagem() {
    if (!input.trim() || carregando) return;
    if (uso?.restante === 0 && !uso?.ilimitado) return;

    const msgTexto = input;
    const msgUsuario: Mensagem     = { papel: 'user', conteudo: msgTexto };
    const placeholder: Mensagem   = { papel: 'assistant', conteudo: '', transmitindo: true };

    setMensagens(prev => [...prev, msgUsuario, placeholder]);
    setInput('');
    setCarregando(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ mensagem: msgTexto }),
      });

      // Limite atingido
      if (res.status === 429) {
        setMensagens(prev => prev.slice(0, -1)); // remove placeholder
        setUso(prev => prev ? { ...prev, restante: 0 } : prev);
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split('\n\n');
        buffer = linhas.pop() ?? '';

        for (const linha of linhas) {
          if (!linha.startsWith('data: ')) continue;
          try {
            const dados = JSON.parse(linha.slice(6));

            if (dados.texto) {
              setMensagens(prev => {
                const atualizado = [...prev];
                const ultima = { ...atualizado[atualizado.length - 1] };
                ultima.conteudo += dados.texto;
                atualizado[atualizado.length - 1] = ultima;
                return atualizado;
              });
            }

            if (dados.concluido) {
              setMensagens(prev => {
                const atualizado = [...prev];
                const ultima = { ...atualizado[atualizado.length - 1] };
                ultima.transmitindo = false;
                ultima.fontes       = dados.fontes ?? [];
                atualizado[atualizado.length - 1] = ultima;
                return atualizado;
              });

              if (!uso?.ilimitado) {
                setUso(prev => prev ? {
                  ...prev,
                  usado:    prev.usado + 1,
                  restante: prev.restante !== null ? prev.restante - 1 : null,
                } : prev);
              }
            }

            if (dados.erro) {
              // Exibe mensagem de erro inline
              setMensagens(prev => {
                const atualizado = [...prev];
                const ultima = { ...atualizado[atualizado.length - 1] };
                ultima.conteudo     = dados.erro;
                ultima.transmitindo = false;
                atualizado[atualizado.length - 1] = ultima;
                return atualizado;
              });
            }

          } catch { /* evento malformado — ignorar */ }
        }
      }
    } finally {
      setCarregando(false);
    }
  }

  const limiteAtingido = uso ? (uso.restante === 0 && !uso.ilimitado) : false;

  return (
    <div className="flex flex-col h-full">

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {mensagens.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-[#c9b882]/50 text-sm font-serif italic">
              "O que aconteceu no Irã antes da guerra começar?"
            </p>
            <p className="text-[#c9b882]/50 text-sm font-serif italic">
              "Quais crises têm padrão similar ao atual?"
            </p>
            <p className="text-[#c9b882]/50 text-sm font-serif italic">
              "Como a eleição alemã pode afetar o agro brasileiro?"
            </p>
            <p className="text-white/20 text-xs mt-6">
              Pergunte qualquer coisa sobre o conteúdo do canal.
            </p>
          </div>
        )}

        {mensagens.map((msg, i) => (
          <ChatMensagem key={i} mensagem={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {limiteAtingido && <ChatLimiteBanner plano={uso?.plano ?? ''} />}

      {/* Input */}
      <div className="border-t border-white/10 px-6 py-4">
        {uso && !uso.ilimitado && (
          <p className="text-[10px] text-white/20 mb-2 text-right">
            {uso.restante} pergunta{uso.restante !== 1 ? 's' : ''} restante{uso.restante !== 1 ? 's' : ''} hoje
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
            placeholder={limiteAtingido ? 'Limite diário atingido' : 'Pergunte sobre o conteúdo do canal...'}
            disabled={carregando || limiteAtingido}
            className="flex-1 bg-[#111] border border-white/10 text-[#e8e4dc] text-sm
                       px-4 py-2.5 focus:border-[#c9b882]/40 outline-none
                       disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={enviarMensagem}
            disabled={carregando || !input.trim() || limiteAtingido}
            className="bg-[#c9b882] text-[#0a0a0b] text-xs tracking-wider uppercase
                       px-4 py-2.5 font-medium hover:bg-[#d9ca99] transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {carregando ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### `ChatMensagem`

```tsx
// src/components/chat/ChatMensagem.tsx
import { ChatFontes } from './ChatFontes';

interface Props {
  mensagem: {
    papel: 'user' | 'assistant';
    conteudo: string;
    fontes?: any[];
    transmitindo?: boolean;
  };
}

export function ChatMensagem({ mensagem }: Props) {
  const isUser = mensagem.papel === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <p className={`text-[10px] tracking-wider uppercase mb-1.5
          ${isUser ? 'text-right text-white/25' : 'text-[#c9b882]/50'}`}>
          {isUser ? 'Você' : 'Geopolítica para Investidores'}
        </p>

        <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-white/[0.06] text-[#e8e4dc] border border-white/[0.08]'
            : 'bg-[#111113] text-[#e8e4dc]/80 border border-[#c9b882]/10'
          }`}
        >
          {mensagem.conteudo}
          {mensagem.transmitindo && (
            <span className="inline-block w-1 h-4 bg-[#c9b882] ml-1 animate-pulse" />
          )}
        </div>

        {!isUser && !mensagem.transmitindo && (mensagem.fontes?.length ?? 0) > 0 && (
          <ChatFontes fontes={mensagem.fontes!} />
        )}
      </div>
    </div>
  );
}
```

#### `ChatFontes`

```tsx
// src/components/chat/ChatFontes.tsx
const ROTULOS: Record<string, string> = {
  conteudo: 'Biblioteca',
  evento:   'Feed',
  pais:     'Perfil de País',
  crise:    'Crise Histórica',
};

const CORES: Record<string, string> = {
  conteudo: 'text-[#c9b882] border-[#c9b882]/30',
  evento:   'text-blue-400 border-blue-400/30',
  pais:     'text-green-400 border-green-400/30',
  crise:    'text-orange-400 border-orange-400/30',
};

export function ChatFontes({ fontes }: { fontes: any[] }) {
  if (!fontes?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {fontes.map((fonte, i) => {
        const href  = fonte.slug
          ? (fonte.slug.startsWith('/') ? fonte.slug : `/dashboard/biblioteca/${fonte.slug}`)
          : fonte.url;
        const cor   = CORES[fonte.tipo] ?? CORES.conteudo;
        const titulo = fonte.titulo.length > 40
          ? fonte.titulo.substring(0, 38) + '...'
          : fonte.titulo;
        const conteudo = (
          <><span className="opacity-50">{ROTULOS[fonte.tipo]} · </span>{titulo}</>
        );

        return href ? (
          <a key={i} href={href} target={fonte.url ? '_blank' : '_self'} rel="noreferrer"
            className={`text-[10px] border px-2 py-1 hover:opacity-80 transition-opacity ${cor}`}>
            {conteudo}
          </a>
        ) : (
          <span key={i} className={`text-[10px] border px-2 py-1 ${cor}`}>
            {conteudo}
          </span>
        );
      })}
    </div>
  );
}
```

#### `ChatLimiteBanner`

```tsx
// src/components/chat/ChatLimiteBanner.tsx
export function ChatLimiteBanner({ plano }: { plano: string }) {
  const proximoPlano  = plano === 'essencial' ? 'Pro' : 'Reservado';
  const proximoLimite = plano === 'essencial' ? '20' : 'ilimitadas';

  return (
    <div className="mx-6 mb-3 border border-[#c9b882]/20 bg-[#c9b882]/5 px-4 py-3">
      <p className="text-xs text-[#e8e4dc]/70 mb-2">
        Você atingiu o limite de perguntas do plano {plano} para hoje.
        O limite reinicia à meia-noite (horário de Brasília).
      </p>
      <a href="#planos"
        className="text-[10px] tracking-wider uppercase text-[#c9b882] hover:text-[#d9ca99] transition-colors">
        Fazer upgrade para o plano {proximoPlano} e ter {proximoLimite} perguntas por dia →
      </a>
    </div>
  );
}
```

---

### 7.3 Fluxo de Dados

```
Montagem da página /dashboard/chat
    ├── GET /api/chat/historico  → setMensagens(historico.mensagens)
    └── GET /api/chat/uso        → setUso({ plano, usado, limite, restante, ilimitado })

Usuário envia mensagem
    └── POST /api/chat (fetch nativo com Accept: text/event-stream)
            ├── 429 Limite atingido
            │       └── remove placeholder + exibe ChatLimiteBanner
            └── 200 SSE streaming
                    ├── { texto: "..." }        → acumula no placeholder (cursor pulsante)
                    ├── { fontes: [...], concluido: true }
                    │       ├── finaliza placeholder (transmitindo = false)
                    │       ├── exibe ChatFontes com badges por tipo
                    │       └── decrementa uso.restante no estado local
                    └── { erro: "...", concluido: true }
                            └── exibe mensagem de erro no lugar do placeholder

Nota: fetch nativo é necessário para SSE incremental.
axios não suporta streaming de ReadableStream nativo em React.
```

---

## 8. Agendamentos (Laravel Scheduler)

```php
// routes/console.php (Laravel 13)

use Illuminate\Support\Facades\Schedule;
use App\Models\ChatUso;
use App\Models\ChatSessao;

// Limpar registros de uso e sessões com mais de 30 dias
// Roda às 03:00 BRT para não interferir com o limite de meia-noite
Schedule::call(function () {
    $corte = now()->timezone('America/Sao_Paulo')->subDays(30)->toDateString();
    ChatUso::where('data_chave', '<', $corte)->delete();
    ChatSessao::where('data_chave', '<', $corte)->delete();
})->dailyAt('03:00')
  ->timezone('America/Sao_Paulo')
  ->name('chat:limpar-dados-antigos')
  ->withoutOverlapping();
```

---

## 9. Jobs / Queues

Nenhum job assíncrono neste módulo. O streaming da Claude API é processado de forma síncrona na `StreamedResponse`. O Scheduler usa `Schedule::call()` inline, sem jobs em fila.

---

## 10. Controle de Acesso

| Role | Limite diário | Tipos de conteúdo no retrieval |
|---|---|---|
| `assinante_essencial` | 5 perguntas/dia | Apenas `briefing` |
| `assinante_pro` | 20 perguntas/dia | `briefing`, `mapa`, `tese` |
| `assinante_reservado` | Ilimitado | `briefing`, `mapa`, `tese` |
| `admin` | Ilimitado | Todos os tipos |

O controle de tipo de conteúdo é implementado em `ChatRecuperacaoService::buscarConteudos()` via `whereIn('tipo', $tiposPermitidos)`.

---

## 11. Error Handling

| Código HTTP | Situação | Mensagem padrão |
|---|---|---|
| 401 | Token ausente ou inválido | `"Não autenticado."` |
| 403 | Assinatura inativa | `"Sua assinatura está inativa."` |
| 422 | Mensagem vazia ou inválida | `{ "errors": { "mensagem": ["..."] } }` |
| 429 | Limite diário atingido | `{ "erro": "limite_atingido", "mensagem": "...", "plano": "...", "limite": N }` |
| 500 SSE | Erro na Claude API ou retrieval | `{ "erro": "Erro ao processar...", "concluido": true }` via stream |

---

## 12. Checklist de Entrega

### Banco de dados e configuração
- [ ] Migration `create_chat_sessoes_table` executada (UNIQUE em `user_id + data_chave`)
- [ ] Migration `create_chat_uso_table` executada (UNIQUE em `user_id + data_chave`)
- [ ] Índice FULLTEXT adicionado à tabela `eventos`: `MATCH(titulo, analise_ia)` (M01)
- [ ] Índice FULLTEXT verificado/adicionado à tabela `conteudos`: `MATCH(titulo, corpo)` (M03)
- [ ] `ANTHROPIC_API_KEY` configurado no `.env`
- [ ] `config/services.php` com `anthropic.key` e `anthropic.model`
- [ ] SDK Anthropic para PHP instalado via Composer (`anthropic-ai/anthropic-sdk-php` ou equivalente)

### Backend Laravel
- [ ] `ChatRecuperacaoService::buscarConteudos` filtrando por plano corretamente
- [ ] `ChatRecuperacaoService::buscarEventos` limitando a últimos 90 dias
- [ ] `ChatRecuperacaoService::buscarPaises` retornando perfis relevantes
- [ ] `ChatRecuperacaoService::buscarCrises` retornando crises por título/contexto
- [ ] Máximo de 8 fontes combinadas sendo respeitado em `recuperar()`
- [ ] `ChatService::verificarLimite` retornando `null` para plano `reservado` e `admin`
- [ ] Streaming SSE emitindo tokens progressivamente com `ob_flush()` + `flush()`
- [ ] Header `X-Accel-Buffering: no` presente na resposta (Nginx)
- [ ] Histórico sendo salvo após cada troca bem-sucedida de mensagens
- [ ] `ChatUso::incrementar` usando `INSERT ... ON DUPLICATE KEY UPDATE` (atômico)
- [ ] `ChatController::enviar` verificando limite antes de iniciar streaming
- [ ] Scheduler de limpeza configurado em `routes/console.php` para 03:00 BRT

### Frontend React
- [ ] Histórico carregado ao montar a página
- [ ] Exemplos de perguntas exibidos quando histórico está vazio
- [ ] Streaming visual — cursor pulsante enquanto resposta é gerada
- [ ] `ChatMensagem` com bolhas distintas para usuário e assistente
- [ ] `ChatFontes` com badges coloridos e distintos por tipo de fonte
- [ ] Fontes com `slug` linkando para páginas internas do dashboard
- [ ] Fontes com `url` abrindo em nova aba (`target="_blank"`)
- [ ] Contador de perguntas restantes visível acima do input
- [ ] Input desabilitado quando limite é atingido ou `carregando = true`
- [ ] `ChatLimiteBanner` exibido com link de upgrade
- [ ] Scroll automático para a última mensagem em cada atualização
- [ ] Status 429 tratado corretamente (remove placeholder, não tenta parsear SSE)
- [ ] Erros no stream (`dados.erro`) exibidos inline na bolha do assistente
- [ ] Rota `/dashboard/chat` adicionada ao `App.tsx` e ao menu de navegação do dashboard
