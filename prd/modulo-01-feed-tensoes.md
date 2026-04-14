# PRD — Módulo 1: Feed de Tensões Ativas
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica
**Versão:** 2.0 (reescrito para Laravel 13 + React SPA)
**Data:** Abril 2026
**Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral

O Módulo 1 é o **Feed de Tensões Ativas** — o coração do dashboard de inteligência geopolítica. Seu objetivo é monitorar fontes abertas de notícias globais, filtrar automaticamente os eventos com relevância para investidores brasileiros usando IA (Claude API), classificar por impacto e exibir num dashboard de visual denso e escuro inspirado no Terminal Bloomberg.

**O resultado para o assinante:** abrir o dashboard e em 30 segundos saber quais eventos geopolíticos ativos importam para o Brasil — sem precisar vasculhar 15 sites diferentes.

### Diferencial Competitivo
A combinação de coleta automatizada (RSS + GDELT) com análise de IA calibrada para o contexto brasileiro é o que nenhum dashboard de OSINT convencional entrega. O sistema não apenas agrega notícias — ele filtra, classifica e contextualiza para um público específico.

### Critérios de Relevância (IA)
Um evento é marcado como relevante apenas se tiver impacto direto ou indireto sobre o Brasil ou investidores brasileiros. Priorizar eventos que afetem:
- **Energia** — petróleo, gás, renováveis, preços globais
- **Alimentos** — grãos, fertilizantes, rotas de exportação
- **Câmbio** — dólar, yuan, euro, dinâmica de reservas globais
- **Cadeias de suprimento** — semicondutores, metais, logística
- **Alianças** — reconfiguração entre potências com impacto em fluxos comerciais
- **Eleições, sanções ou mudanças de regime** em países estratégicos

### Escala de Impacto

| Score | Label     | Critério |
|-------|-----------|----------|
| 9–10  | CRÍTICO   | Guerra declarada, colapso de moeda, bloqueio de rota estratégica |
| 7–8   | ALTO      | Sanções relevantes, eleição de líder anti-mercado em país estratégico |
| 5–6   | MÉDIO     | Negociações em andamento, tensões crescentes |
| 1–4   | MONITORAR | Declarações, movimentações diplomáticas discretas |

### Categorias Válidas
`energia` | `alimentos` | `câmbio` | `cadeias-suprimento` | `alianças` | `sanções` | `eleições` | `conflito-militar` | `commodities` | `comércio`

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Backend | Laravel 13 | Framework PHP maduro, ecosystem rico, ideal para APIs REST |
| Autenticação | Laravel Sanctum | Tokens de API para SPA, simples e seguro |
| Autorização | Spatie Laravel Permission | Controle de roles/permissions granular |
| Banco de dados | MySQL 8+ | Relacional robusto, suporte nativo a JSON e full-text |
| Cache / Filas | Redis | Cache de respostas, gerenciamento de jobs assíncronos |
| Coleta RSS | vknet/rss-reader (Composer) | Parser RSS/Atom em PHP, sem dependências externas |
| IA / Análise | Claude API (Anthropic SDK PHP) | Melhor custo-benefício para análise contextual em português |
| Frontend | React 19 + TypeScript | SPA com tipagem estrita |
| Build | Vite 6 | Hot module replacement rápido, bundle otimizado |
| Estilo | TailwindCSS 4 | Produtividade alta, tema dark customizável |
| Estado servidor | React Query (TanStack Query v5) | Cache de dados, refetch automático, mutations |
| Roteamento | React Router v7 | SPA routing client-side |
| Hospedagem Backend | VPS (DigitalOcean / Hetzner) | Controle total, suporte a Laravel Scheduler |
| Hospedagem Frontend | Vercel ou mesmo VPS | CDN global, deploy automático |

**Custo mensal estimado em produção:**
- VPS 4 GB RAM: R$ 60–120/mês
- Claude API: R$ 50–200 dependendo do volume de chamadas
- Total: menos de R$ 350/mês para começar

---

## 3. Dependências de Outros Módulos

| Módulo | Dependência | Tipo |
|--------|-------------|------|
| Nenhum | — | — |

O Módulo 1 é o módulo fundacional. Todos os demais dependem dele.

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|------|-------|
| Prazo MVP | 3 dias de desenvolvimento |
| Custo estimado | R$ 3.000 – R$ 8.000 |
| Custo mensal | R$ 100–350/mês |

**Cronograma:**

| Dia | Foco | Entregáveis |
|-----|------|-------------|
| Dia 1 | Backend e dados | Projeto Laravel criado, banco configurado, RSS fetcher e IA funcionando, endpoints respondendo |
| Dia 2 | Frontend | Dashboard com visual correto, filtros, cards e autenticação básica |
| Dia 3 | Produção e testes | Deploy, scheduler ativo, teste com dados reais, ajustes finais |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── FeedController.php          ← listagem do feed
│   │       └── FeedUpdateController.php    ← disparo manual de update (admin)
│   ├── Requests/
│   │   └── FeedFilterRequest.php           ← validação de filtros
│   └── Resources/
│       ├── EventResource.php               ← transformação de resposta
│       └── EventCollection.php
├── Models/
│   ├── Event.php
│   └── Source.php
├── Services/
│   ├── RssFetcherService.php               ← coleta RSS das fontes
│   ├── AiAnalyzerService.php               ← análise via Claude API
│   └── FeedUpdaterService.php              ← orquestra coleta + análise + persistência
├── Jobs/
│   └── ProcessFeedUpdateJob.php            ← job assíncrono de atualização
└── Console/
    └── Commands/
        └── UpdateFeedCommand.php           ← comando artisan para forçar update

config/
├── claude.php                              ← API key e configurações da IA
└── feed.php                               ← fontes RSS, limites, timeouts

database/
├── migrations/
│   ├── 2026_04_01_000001_create_sources_table.php
│   └── 2026_04_01_000002_create_events_table.php
└── seeders/
    └── SourcesSeeder.php                   ← fontes RSS iniciais

routes/
└── api.php                                 ← rotas da API
```

### 5.2 Models e Migrations

#### Migration: `create_sources_table`
```php
Schema::create('sources', function (Blueprint $table) {
    $table->id();
    $table->string('nome');
    $table->string('rss_url');
    $table->string('categoria')->nullable();
    $table->boolean('ativo')->default(true);
    $table->timestamp('ultima_coleta_em')->nullable();
    $table->timestamps();
});
```

#### Migration: `create_events_table`
```php
Schema::create('events', function (Blueprint $table) {
    $table->id();
    $table->string('titulo');
    $table->text('resumo')->nullable();
    $table->text('analise_ia')->nullable();
    $table->string('fonte');
    $table->string('fonte_url')->nullable();
    $table->string('regiao')->nullable();
    $table->tinyInteger('impact_score')->nullable();        // 1–10
    $table->string('impact_label')->nullable();            // CRÍTICO|ALTO|MÉDIO|MONITORAR
    $table->json('categorias')->nullable();                // array de strings
    $table->boolean('relevante')->default(false);
    $table->boolean('ativo')->default(true);
    $table->timestamp('publicado_em');
    $table->timestamps();

    $table->index('publicado_em');
    $table->index('impact_score');
    $table->index('regiao');
    $table->fullText(['titulo', 'resumo']);
});
```

#### Model: `Event`
```php
// app/Models/Event.php
class Event extends Model
{
    protected $fillable = [
        'titulo', 'resumo', 'analise_ia', 'fonte', 'fonte_url',
        'regiao', 'impact_score', 'impact_label', 'categorias',
        'relevante', 'ativo', 'publicado_em',
    ];

    protected $casts = [
        'categorias'   => 'array',
        'relevante'    => 'boolean',
        'ativo'        => 'boolean',
        'publicado_em' => 'datetime',
    ];

    public function scopeAtivos($query): void
    {
        $query->where('ativo', true)->where('relevante', true);
    }

    public function scopeUltimas48h($query): void
    {
        $query->where('publicado_em', '>=', now()->subHours(48));
    }
}
```

#### Model: `Source`
```php
// app/Models/Source.php
class Source extends Model
{
    protected $fillable = ['nome', 'rss_url', 'categoria', 'ativo', 'ultima_coleta_em'];

    protected $casts = [
        'ativo'           => 'boolean',
        'ultima_coleta_em' => 'datetime',
    ];

    public function scopeAtivas($query): void
    {
        $query->where('ativo', true);
    }
}
```

#### Seeder: `SourcesSeeder`
```php
// Fontes RSS iniciais
$fontes = [
    ['nome' => 'Reuters World',      'rss_url' => 'https://feeds.reuters.com/reuters/worldNews',    'categoria' => 'global'],
    ['nome' => 'Reuters Business',   'rss_url' => 'https://feeds.reuters.com/reuters/businessNews', 'categoria' => 'economia'],
    ['nome' => 'Al Jazeera',         'rss_url' => 'https://www.aljazeera.com/xml/rss/all.xml',      'categoria' => 'global'],
    ['nome' => 'Foreign Policy',     'rss_url' => 'https://foreignpolicy.com/feed/',                'categoria' => 'analise'],
    ['nome' => 'CFR',                'rss_url' => 'https://www.cfr.org/rss/all',                    'categoria' => 'analise'],
    ['nome' => 'BBC World',          'rss_url' => 'https://feeds.bbci.co.uk/news/world/rss.xml',    'categoria' => 'global'],
    ['nome' => 'Financial Times',    'rss_url' => 'https://www.ft.com/world?format=rss',            'categoria' => 'economia'],
    ['nome' => 'Valor Econômico',    'rss_url' => 'https://valor.globo.com/rss/economia',           'categoria' => 'brasil'],
];
```

### 5.3 Services

#### `RssFetcherService`
```php
// app/Services/RssFetcherService.php
namespace App\Services;

use App\Models\Source;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RssFetcherService
{
    /**
     * Coleta até $limite itens de uma fonte RSS.
     * Filtra itens com mais de 24h.
     * Retorna array de itens normalizados.
     */
    public function coletar(Source $source, int $limite = 10): array
    {
        // Busca RSS, parseia XML, filtra por data, remove duplicatas via fonte_url
        // Retorna: [['titulo', 'fonte_url', 'resumo', 'publicado_em'], ...]
    }

    public function coletarTodas(): array
    {
        return Source::ativas()->get()
            ->flatMap(fn($s) => $this->coletar($s))
            ->toArray();
    }
}
```

#### `AiAnalyzerService`
```php
// app/Services/AiAnalyzerService.php
namespace App\Services;

use Anthropic\Client;

class AiAnalyzerService
{
    public function __construct(private Client $anthropic) {}

    /**
     * Analisa um lote de eventos e retorna array com:
     * isRelevant, impact_score, impact_label, regiao, categorias[], analise_ia
     */
    public function analisar(array $eventos): array
    {
        // Monta prompt com critérios de relevância, escala de impacto e categorias válidas
        // Envia para claude-sonnet-4-5 em lotes de 5
        // Parseia JSON retornado
        // Retorna array indexado por fonte_url
    }
}
```

#### `FeedUpdaterService`
```php
// app/Services/FeedUpdaterService.php
namespace App\Services;

use App\Models\Event;

class FeedUpdaterService
{
    public function __construct(
        private RssFetcherService $rss,
        private AiAnalyzerService $ia,
    ) {}

    /**
     * Orquestra o ciclo completo:
     * 1. Coleta RSS de todas as fontes ativas
     * 2. Remove URLs já existentes no banco (deduplicação)
     * 3. Analisa novos eventos com IA em lotes de 5
     * 4. Persiste apenas os relevantes
     * Retorna: ['coletados' => N, 'novos' => N, 'salvos' => N]
     */
    public function executar(): array
    {
        $itens    = $this->rss->coletarTodas();
        $urlsExistentes = Event::whereIn('fonte_url',
            collect($itens)->pluck('fonte_url')
        )->pluck('fonte_url')->toArray();

        $novos = array_filter($itens, fn($i) => !in_array($i['fonte_url'], $urlsExistentes));

        $analises = $this->ia->analisar(array_values($novos));

        $salvos = 0;
        foreach ($analises as $analise) {
            if ($analise['isRelevant']) {
                Event::create($analise);
                $salvos++;
            }
        }

        return ['coletados' => count($itens), 'novos' => count($novos), 'salvos' => $salvos];
    }
}
```

### 5.4 FormRequests

```php
// app/Http/Requests/FeedFilterRequest.php
class FeedFilterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'categoria' => ['nullable', 'string', 'in:energia,alimentos,câmbio,cadeias-suprimento,alianças,sanções,eleições,conflito-militar,commodities,comércio'],
            'regiao'    => ['nullable', 'string', 'max:100'],
            'label'     => ['nullable', 'string', 'in:CRÍTICO,ALTO,MÉDIO,MONITORAR'],
            'cursor'    => ['nullable', 'date'],
            'limite'    => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
```

### 5.5 Controllers e Rotas

```php
// app/Http/Controllers/Api/FeedController.php
class FeedController extends Controller
{
    public function __construct(private FeedUpdaterService $updater) {}

    /**
     * Retorna eventos filtrados com paginação por cursor.
     * Requer autenticação via Sanctum.
     * Resposta filtrada automaticamente por role do usuário.
     */
    public function index(FeedFilterRequest $request): JsonResponse
    {
        // Aplica filtros, ordena por impact_score desc / publicado_em desc
        // Paginação cursor-based
        // Retorna EventCollection
    }

    /**
     * Dispara atualização manual do feed (apenas admin).
     */
    public function atualizar(): JsonResponse
    {
        $resultado = $this->updater->executar();
        return response()->json($resultado);
    }
}
```

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/feed', [FeedController::class, 'index']);

    Route::middleware('role:admin')->group(function () {
        Route::post('/feed/atualizar', [FeedController::class, 'atualizar']);
    });
});
```

---

## 6. Endpoints da API

| Método | Path | Auth | Params | Response |
|--------|------|------|--------|----------|
| GET | `/api/feed` | Sanctum (qualquer role) | `categoria`, `regiao`, `label`, `cursor`, `limite` | `{ data: Event[], next_cursor, total }` |
| POST | `/api/feed/atualizar` | Sanctum + role `admin` | — | `{ coletados, novos, salvos }` |

### Response: Event
```json
{
  "id": 1,
  "titulo": "EUA ampliam sanções ao setor energético russo",
  "resumo": "Pacote de sanções mais amplo desde 2022...",
  "analise_ia": "Impacto direto no preço do petróleo Brent. Brasil, como importador líquido de derivados, pode sentir pressão inflacionária nos próximos 30 dias.",
  "fonte": "Reuters World",
  "fonte_url": "https://...",
  "regiao": "Rússia",
  "impact_score": 8,
  "impact_label": "ALTO",
  "categorias": ["sanções", "energia"],
  "publicado_em": "2026-04-14T10:30:00Z"
}
```

---

## 7. Frontend React

### 7.1 Estrutura de Componentes e Páginas

```
src/
├── pages/
│   ├── Login.tsx                  ← autenticação
│   └── dashboard/
│       └── Feed.tsx               ← página principal do feed
├── components/
│   ├── feed/
│   │   ├── EventCard.tsx          ← card individual de evento
│   │   ├── EventList.tsx          ← lista com scroll infinito
│   │   ├── FilterBar.tsx          ← filtros por categoria/label
│   │   └── ImpactBadge.tsx        ← badge colorido de impacto
│   ├── layout/
│   │   ├── DashboardLayout.tsx    ← layout principal com nav
│   │   └── TopNav.tsx             ← navegação entre módulos
│   └── ui/
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useFeed.ts                 ← React Query hook para o feed
│   └── useAuth.ts                 ← contexto de autenticação
├── services/
│   └── api.ts                     ← Axios instance + interceptors
└── types/
    └── feed.ts                    ← interfaces TypeScript
```

### 7.2 Componentes Principais

**EventCard** — exibe as seguintes informações na ordem:
1. Score numérico (1–10) em destaque na lateral esquerda
2. Badge de impacto (CRÍTICO/ALTO/MÉDIO/MONITORAR) com cor correspondente
3. Título — clicável, abre fonte original em nova aba
4. Análise da IA — 2 a 3 frases explicando por que importa para o Brasil
5. Metadados na linha inferior: fonte | região | tempo decorrido | categorias

**Sistema de cores por impacto:**

| Label | Cor Texto | Hex |
|-------|-----------|-----|
| CRÍTICO | Vermelho | `#EF4444` (red-400) |
| ALTO | Laranja | `#FB923C` (orange-400) |
| MÉDIO | Amarelo | `#FACC15` (yellow-400) |
| MONITORAR | Azul | `#60A5FA` (blue-400) |

**FilterBar** — filtros disponíveis: Todos | Energia | Alimentos | Câmbio | Conflitos | Sanções | Eleições | Commodities

**Atualização automática:** React Query configurado com `refetchInterval: 5 * 60 * 1000` (5 minutos).

### 7.3 Fluxo do Usuário
1. Usuário acessa `/login` → autentica com email + senha → recebe token Sanctum
2. Redirecionado para `/dashboard/feed`
3. Hook `useFeed` carrega eventos via `GET /api/feed`
4. Filtros atualizam query params e re-executam a query
5. Scroll infinito carrega próxima página via `cursor`
6. Feed atualiza automaticamente a cada 5 minutos

### 7.4 Design
- Fundo escuro: `#0a0a0b` (referência ao Terminal Bloomberg)
- Tipografia monospace para dados, sans-serif para análise
- Cor dourada `#C9B882` como cor de destaque da marca
- Densidade de informação alta — sem espaços em branco desnecessários

---

## 8. Agendamentos (Laravel Scheduler)

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Atualiza o feed de tensões a cada hora
    $schedule->job(new ProcessFeedUpdateJob())
        ->hourly()
        ->withoutOverlapping()
        ->onFailure(function () {
            Log::error('ProcessFeedUpdateJob falhou no scheduler.');
        });

    // Limpeza de eventos antigos (mais de 30 dias) — diariamente às 3h
    $schedule->command('feed:limpar-antigos')
        ->dailyAt('03:00');
}
```

---

## 9. Jobs e Queues

### `ProcessFeedUpdateJob`
```php
// app/Jobs/ProcessFeedUpdateJob.php
class ProcessFeedUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 300; // 5 minutos

    public function handle(FeedUpdaterService $updater): void
    {
        $resultado = $updater->executar();
        Log::info('Feed atualizado', $resultado);
    }

    public function failed(Throwable $e): void
    {
        Log::error('Feed update falhou', ['erro' => $e->getMessage()]);
    }
}
```

**Configuração de filas:**
```
# .env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**Worker (supervisor ou Forge):**
```bash
php artisan queue:work redis --queue=default --tries=3 --timeout=300
```

---

## 10. Controle de Acesso (Spatie Roles)

| Role | Permissões no Módulo 1 |
|------|------------------------|
| `assinante_essencial` | Leitura do feed (últimas 48h, máx. 20 eventos) |
| `assinante_pro` | Leitura do feed (últimas 48h, sem limite de eventos) |
| `assinante_reservado` | Leitura do feed histórico completo + todos os filtros |
| `admin` | Leitura + disparo manual de atualização |

```php
// Seeder de roles
Role::create(['name' => 'assinante_essencial']);
Role::create(['name' => 'assinante_pro']);
Role::create(['name' => 'assinante_reservado']);
Role::create(['name' => 'admin']);
```

O controller aplica restrições de acordo com o role:
```php
$limite = match(true) {
    $user->hasRole('assinante_essencial') => 20,
    default => 100,
};

$dataMinima = match(true) {
    $user->hasRole('assinante_reservado') || $user->hasRole('admin') => null,
    default => now()->subHours(48),
};
```

---

## 11. Error Handling

| Cenário | Tratamento |
|---------|-----------|
| Fonte RSS offline | Log de warning, continua com outras fontes, retenta na próxima hora |
| Claude API timeout | Retry automático (3x) via Job `tries`, alerta no log |
| Claude API retorna JSON inválido | Log de erro + skip do item, não interrompe o lote |
| Banco de dados indisponível | Job falha, re-enfileirado pelo Horizon/Supervisor |
| Autenticação inválida | HTTP 401 com mensagem padronizada |
| Role insuficiente | HTTP 403 com mensagem padronizada |
| Parâmetro inválido | HTTP 422 via FormRequest com detalhes dos campos |

```php
// Handler global em app/Exceptions/Handler.php
$this->renderable(function (AuthenticationException $e) {
    return response()->json(['erro' => 'Não autenticado.'], 401);
});

$this->renderable(function (AuthorizationException $e) {
    return response()->json(['erro' => 'Acesso negado.'], 403);
});
```

---

## 12. Checklist de Entrega

### Infraestrutura
- [ ] Projeto Laravel 13 criado com `composer create-project`
- [ ] `.env` configurado (DB, Redis, Claude API key, Sanctum)
- [ ] Migrations executadas sem erros
- [ ] Seeder de Sources populando as 8 fontes iniciais
- [ ] Roles Spatie criados (4 roles)
- [ ] Redis operacional e fila `default` configurada

### Coleta de Dados
- [ ] `RssFetcherService` coletando ao menos 3 fontes com sucesso
- [ ] Filtro de 24h funcionando corretamente
- [ ] Deduplicação removendo URLs repetidas
- [ ] `ultima_coleta_em` sendo atualizado na tabela `sources`

### Análise com IA
- [ ] Claude API retornando JSON válido para todos os eventos
- [ ] Critérios de relevância filtrando corretamente (testar com notícias de esportes)
- [ ] Scores de impacto distribuídos de forma coerente (1–10)
- [ ] Campo `analise_ia` com 2–3 frases em português

### API Laravel
- [ ] `GET /api/feed` retornando eventos paginados
- [ ] Filtros por categoria, label e região funcionando
- [ ] Paginação cursor-based retornando `next_cursor`
- [ ] `POST /api/feed/atualizar` restrito ao role `admin`
- [ ] HTTP 401 para requisições sem token
- [ ] HTTP 403 para roles insuficientes

### Jobs e Scheduler
- [ ] `ProcessFeedUpdateJob` executando sem erros
- [ ] Scheduler rodando a cada hora (testar com `artisan schedule:run`)
- [ ] Worker de fila ativo (supervisor ou `artisan queue:work`)
- [ ] Failed jobs registrados e notificados

### Frontend React
- [ ] Dashboard renderizando com visual escuro correto
- [ ] Cards exibindo score, badge, título, análise e metadados
- [ ] Cores por impacto aplicadas corretamente
- [ ] Filtros por categoria funcionando
- [ ] Atualização automática a cada 5 minutos (React Query)
- [ ] Login protegendo o acesso sem autenticação

### Integração
- [ ] Token Sanctum retornado no login e armazenado no frontend
- [ ] Header `Authorization: Bearer {token}` enviado em todas as requisições
- [ ] Variáveis de ambiente do frontend apontando para a API correta
