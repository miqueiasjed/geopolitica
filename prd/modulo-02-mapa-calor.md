# PRD — Módulo 2: Mapa de Calor Geopolítico
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica
**Versão:** 2.0 (reescrito para Laravel 13 + React SPA)
**Data:** Abril 2026
**Depende de:** Módulo 1 concluído
**Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral

O Módulo 2 é o **Mapa de Calor Geopolítico** — uma visualização interativa do mundo onde cada região exibe uma intensidade de cor proporcional ao volume e gravidade dos eventos geopolíticos ativos. O assinante clica em qualquer região e um painel lateral exibe os eventos ativos naquela área com a análise completa.

O módulo combina duas fontes de dados:
- **Eventos do Módulo 1** (tabela `events`) — dados curados com análise de IA
- **GDELT Project** — dados geopolíticos globais, gratuitos, cobertura de países menos cobertos pela mídia ocidental

**O que o assinante experimenta:**
1. Abre o Mapa de Calor na navegação do dashboard
2. Vê o mundo colorido por intensidade geopolítica — do cinza (calmo) ao vermelho (crítico)
3. Clica numa região ou país → painel lateral abre com os eventos ativos
4. Cada evento tem título, análise da IA, fonte e score de impacto
5. O mapa atualiza automaticamente junto com o feed do Módulo 1

**Fórmula de intensidade combinada:**
- Score do Módulo 1 tem peso maior (dados mais curados): `(score_m1 × 0.6) + (intensidade_gdelt × 0.4)`
- Normalização do tom GDELT para escala 1–10: `round(((tom × -1) + 100) / 20) + 1`

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Backend | Laravel 13 (reusa Módulo 1) | — |
| Cache GDELT | Redis (TTL 60 min) | Evita chamadas repetidas à API GDELT |
| Banco | MySQL (tabelas novas + view) | Cache persistente do GDELT, view materializada |
| Frontend Map | React Simple Maps | SVG puro, leve, sem API key, totalmente customizável |
| Dados geográficos | TopoJSON (Natural Earth 110m) | Gratuito, 241 países, resolução ideal para web |
| Escala de cores | d3-scale + d3-scale-chromatic | Interpolação de cores precisa e suave |
| Painel lateral | Framer Motion | Animação de entrada/saída fluida |
| Tooltips | Radix UI Tooltip | Acessível, customizável |
| Fonte GDELT | GDELT API v2 | Cobertura global gratuita, atualização a cada 15 min |

**Dependências npm a instalar:**
```bash
npm install react-simple-maps d3-scale d3-scale-chromatic framer-motion
npm install @radix-ui/react-tooltip topojson-client
npm install -D @types/topojson-client
```

**Arquivo geográfico (baixar uma vez):**
```bash
curl -o public/world-110m.json \
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
```

---

## 3. Dependências de Outros Módulos

| Módulo | Dependência | Tipo |
|--------|-------------|------|
| Módulo 1 | Tabela `events` com campo `regiao` e `impact_score` | Obrigatória |
| Módulo 1 | Sistema de autenticação (Sanctum + roles) | Obrigatória |
| Módulo 1 | Scheduler do Laravel (já configurado) | Obrigatória |

> **Pré-requisito obrigatório:** O Módulo 2 depende do Módulo 1 estar em produção. O GDELT é fonte complementar — não substitui os dados do Módulo 1.

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|------|-------|
| Prazo MVP | 3 dias de desenvolvimento |
| Custo estimado | R$ 5.000 – R$ 12.000 |
| Custo mensal adicional | R$ 0 – R$ 50 (GDELT é gratuito) |

**Cronograma:**

| Dia | Foco | Entregáveis |
|-----|------|-------------|
| Dia 1 | Dados e banco | Tabela `gdelt_cache`, view `mapa_intensidade`, `MapIntensityController`, integração GDELT funcionando |
| Dia 2 | Visualização | Componente `WorldMap` renderizando com cores corretas, tooltip funcionando, endpoint de eventos por região |
| Dia 3 | Painel e integração | `RegionPanel` animado, navegação entre módulos, scheduler atualizado, testes com dados reais |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── MapaIntensidadeController.php   ← intensidade por região
│   │       └── RegiaoEventosController.php     ← eventos por região (painel lateral)
│   └── Resources/
│       └── MapaIntensidadeResource.php
├── Models/
│   └── GdeltCache.php
├── Services/
│   ├── GdeltFetcherService.php                 ← cliente da API GDELT
│   └── MapaIntensidadeService.php              ← calcula intensidade combinada
├── Jobs/
│   └── AtualizarGdeltJob.php                   ← job de atualização do cache GDELT
└── Console/
    └── Commands/
        └── AtualizarGdeltCommand.php

database/
├── migrations/
│   ├── 2026_04_01_000003_create_gdelt_cache_table.php
│   └── 2026_04_01_000004_create_mapa_intensidade_view.php
```

### 5.2 Models e Migrations

#### Migration: `create_gdelt_cache_table`
```php
Schema::create('gdelt_cache', function (Blueprint $table) {
    $table->id();
    $table->string('codigo_pais', 3)->unique();
    $table->string('nome_pais');
    $table->integer('total_eventos')->default(0);
    $table->float('tom_medio')->default(0);
    $table->float('intensidade')->default(0);         // escala 1–10 normalizada
    $table->timestamp('atualizado_em')->useCurrent();
    $table->timestamps();

    $table->index('intensidade');
});
```

#### View: `mapa_intensidade`
```sql
-- Executada via migration raw SQL ou View do Laravel
CREATE OR REPLACE VIEW mapa_intensidade AS
SELECT
    COALESCE(e.regiao, g.nome_pais) AS regiao,
    g.codigo_pais,
    COALESCE(e.total_eventos, 0)    AS eventos_modulo1,
    COALESCE(g.total_eventos, 0)    AS eventos_gdelt,
    COALESCE(e.score_medio, 0)      AS score_modulo1,
    COALESCE(g.intensidade, 0)      AS intensidade_gdelt,
    -- Score final: Módulo 1 tem peso maior (dados mais curados)
    (COALESCE(e.score_medio, 0) * 0.6 +
     COALESCE(g.intensidade, 0) * 0.4) AS intensidade_final
FROM gdelt_cache g
LEFT JOIN (
    SELECT
        regiao,
        COUNT(*)         AS total_eventos,
        AVG(impact_score) AS score_medio
    FROM events
    WHERE ativo = 1
      AND relevante = 1
      AND publicado_em >= NOW() - INTERVAL 48 HOUR
    GROUP BY regiao
) e ON LOWER(e.regiao) = LOWER(g.nome_pais);
```

#### Model: `GdeltCache`
```php
// app/Models/GdeltCache.php
class GdeltCache extends Model
{
    protected $table    = 'gdelt_cache';
    protected $fillable = ['codigo_pais', 'nome_pais', 'total_eventos', 'tom_medio', 'intensidade'];

    protected $casts = [
        'intensidade'  => 'float',
        'tom_medio'    => 'float',
        'atualizado_em' => 'datetime',
    ];
}
```

### 5.3 Services

#### `GdeltFetcherService`
```php
// app/Services/GdeltFetcherService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GdeltFetcherService
{
    private string $baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';

    /**
     * Consulta o GDELT e retorna array com dados por país:
     * ['codigo_pais', 'nome_pais', 'total_eventos', 'tom_medio', 'intensidade']
     *
     * Fórmula de normalização do tom para escala 1–10:
     * intensidade = clamp(round(((tom * -1) + 100) / 20) + 1, 1, 10)
     * Onde: tom -100 → score 10 | tom 0 → score 6 | tom +100 → score 1
     */
    public function buscar(): array
    {
        $url = $this->baseUrl
            . '?query=geopolitics%20conflict%20sanctions%20war'
            . '&mode=artlist&maxrecords=250&format=json&timespan=1d';

        $response = Http::timeout(30)
            ->withHeaders(['User-Agent' => 'GeopoliticaInvestidores/2.0'])
            ->get($url);

        if ($response->failed()) {
            Log::warning('GDELT API indisponível', ['status' => $response->status()]);
            return [];
        }

        $artigos = $response->json('articles', []);

        // Agrega por país e calcula intensidade normalizada
        $porPais = collect($artigos)
            ->filter(fn($a) => !empty($a['sourcecountry']))
            ->groupBy('sourcecountry')
            ->map(function ($grupo, $pais) {
                $tomMedio = $grupo->avg('tone') ?? 0;
                $intensidade = min(10, max(1,
                    round((($tomMedio * -1) + 100) / 20) + 1
                ));
                return [
                    'nome_pais'      => $pais,
                    'total_eventos'  => $grupo->count(),
                    'tom_medio'      => round($tomMedio, 2),
                    'intensidade'    => $intensidade,
                ];
            });

        return $porPais->values()->toArray();
    }
}
```

#### `MapaIntensidadeService`
```php
// app/Services/MapaIntensidadeService.php
namespace App\Services;

use App\Models\GdeltCache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class MapaIntensidadeService
{
    /**
     * Retorna dados de intensidade para todas as regiões.
     * Cache Redis por 15 minutos.
     */
    public function obterIntensidades(): array
    {
        return Cache::remember('mapa_intensidades', 900, function () {
            return DB::table('mapa_intensidade')
                ->orderByDesc('intensidade_final')
                ->get()
                ->toArray();
        });
    }

    /**
     * Invalida o cache após atualização do GDELT.
     */
    public function invalidarCache(): void
    {
        Cache::forget('mapa_intensidades');
    }
}
```

### 5.4 FormRequests

```php
// app/Http/Requests/RegiaoEventosRequest.php
class RegiaoEventosRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'regiao' => ['required', 'string', 'max:100'],
        ];
    }
}
```

### 5.5 Controllers e Rotas

```php
// app/Http/Controllers/Api/MapaIntensidadeController.php
class MapaIntensidadeController extends Controller
{
    public function __construct(private MapaIntensidadeService $servico) {}

    /**
     * Retorna intensidade geopolítica por região para colorir o mapa.
     * Cache de 15 minutos via Redis.
     */
    public function index(): JsonResponse
    {
        $dados = $this->servico->obterIntensidades();
        return response()->json([
            'regioes'      => $dados,
            'atualizado_em' => now()->toISOString(),
        ]);
    }
}

// app/Http/Controllers/Api/RegiaoEventosController.php
class RegiaoEventosController extends Controller
{
    /**
     * Retorna eventos ativos de uma região específica (últimas 48h).
     * Usado pelo painel lateral ao clicar no mapa.
     */
    public function index(RegiaoEventosRequest $request): JsonResponse
    {
        $regiao  = $request->validated('regiao');
        $eventos = Event::ativos()
            ->ultimas48h()
            ->where('regiao', 'LIKE', "%{$regiao}%")
            ->orderByDesc('impact_score')
            ->limit(20)
            ->get();

        return response()->json([
            'regiao'  => $regiao,
            'eventos' => EventResource::collection($eventos),
            'total'   => $eventos->count(),
        ]);
    }
}
```

```php
// routes/api.php — adições do Módulo 2
Route::middleware('auth:sanctum')->group(function () {
    // Módulo 2
    Route::get('/mapa/intensidade',     [MapaIntensidadeController::class, 'index']);
    Route::get('/mapa/regiao-eventos',  [RegiaoEventosController::class, 'index']);
});
```

---

## 6. Endpoints da API

| Método | Path | Auth | Params | Response |
|--------|------|------|--------|----------|
| GET | `/api/mapa/intensidade` | Sanctum (qualquer role) | — | `{ regioes: MapaRegiao[], atualizado_em }` |
| GET | `/api/mapa/regiao-eventos` | Sanctum (qualquer role) | `regiao` (obrigatório) | `{ regiao, eventos: Event[], total }` |

### Response: MapaRegiao
```json
{
  "regiao": "Russia",
  "codigo_pais": "RU",
  "eventos_modulo1": 4,
  "eventos_gdelt": 87,
  "score_modulo1": 8.5,
  "intensidade_gdelt": 7.2,
  "intensidade_final": 7.98
}
```

---

## 7. Frontend React

### 7.1 Estrutura de Componentes e Páginas

```
src/
├── pages/
│   └── dashboard/
│       └── Mapa.tsx                 ← página principal do mapa (tela cheia)
├── components/
│   ├── mapa/
│   │   ├── WorldMap.tsx             ← SVG interativo com React Simple Maps
│   │   ├── RegionPanel.tsx          ← painel lateral deslizante (Framer Motion)
│   │   └── IntensityLegend.tsx      ← legenda de cores (canto inferior esquerdo)
│   └── layout/
│       └── TopNav.tsx               ← nav atualizada com link "Mapa de Calor"
├── hooks/
│   ├── useMapaIntensidade.ts        ← React Query hook para intensidades
│   └── useRegiaoEventos.ts          ← React Query hook para eventos da região
└── types/
    └── mapa.ts                      ← interfaces TypeScript do módulo
```

### 7.2 Componentes Principais

**WorldMap** — renderiza o mapa SVG com `react-simple-maps`:
- Escala de cores: `scaleLinear` com domínio `[0, 3, 6, 10]` mapeando para `["#2a2a2a", "#854d0e", "#dc2626", "#7f1d1d"]`
- Hover: tooltip com nome do país e intensidade
- Click: chama `onRegionClick(nomePais)` para abrir o painel lateral
- Cor de destaque no hover: `#c9b882` (dourado da marca)

**RegionPanel** — painel lateral animado:
- Animação `x: "100%" → 0 → "100%"` via Framer Motion (`AnimatePresence`)
- Exibe lista de eventos com `ImpactBadge`, título, análise IA e metadados
- Estado vazio quando não há eventos na região
- Botão `×` fecha o painel

**IntensityLegend** — posicionada `bottom-6 left-6`, fundo `#111113/90`:
- Gradiente visual da escala
- Legenda: Sem dados → Monitorar (1–4) → Alto/Médio (5–8) → Crítico (9–10)

### 7.3 Fluxo do Usuário
1. Usuário navega para `/dashboard/mapa`
2. Hook `useMapaIntensidade` carrega `GET /api/mapa/intensidade`
3. `WorldMap` aplica a escala de cores por país via `intensidade_final`
4. Hover sobre país → tooltip com nome e intensidade
5. Click em país → `setRegiaoSelecionada(nome)`
6. `RegionPanel` abre com animação, chama `GET /api/mapa/regiao-eventos?regiao=...`
7. Exibe eventos ordenados por `impact_score` descrescente
8. Mapa atualiza automaticamente a cada 10 minutos (`refetchInterval: 600_000`)

### 7.4 Página `Mapa.tsx` — Layout
```
┌─────────────────────────────────────────────────────────┐
│ BARRA SUPERIOR: "Mapa de Calor Geopolítico" + instrução │
├──────────────────────────────────────┬──────────────────┤
│                                      │  REGION PANEL    │
│         WORLD MAP (SVG)             │  (desliza da     │
│    (ocupa 100% da área restante)    │   direita 420px) │
│                                      │                  │
│  [LEGENDA canto inferior esquerdo]  │                  │
└──────────────────────────────────────┴──────────────────┘
```

---

## 8. Agendamentos (Laravel Scheduler)

```php
// app/Console/Kernel.php — adições do Módulo 2
protected function schedule(Schedule $schedule): void
{
    // Módulo 1 — já existente
    $schedule->job(new ProcessFeedUpdateJob())
        ->hourly()
        ->withoutOverlapping();

    // Módulo 2 — GDELT nos minutos :30 de cada hora
    // (30 min após o feed do M1, sem concorrência)
    $schedule->job(new AtualizarGdeltJob())
        ->cron('30 * * * *')
        ->withoutOverlapping()
        ->onFailure(function () {
            Log::error('AtualizarGdeltJob falhou no scheduler.');
        });
}
```

---

## 9. Jobs e Queues

### `AtualizarGdeltJob`
```php
// app/Jobs/AtualizarGdeltJob.php
class AtualizarGdeltJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function handle(
        GdeltFetcherService   $gdelt,
        MapaIntensidadeService $mapa,
    ): void {
        $dados = $gdelt->buscar();

        if (empty($dados)) {
            Log::warning('GDELT retornou 0 países.');
            return;
        }

        // Upsert no banco por nome_pais
        foreach ($dados as $item) {
            GdeltCache::updateOrCreate(
                ['nome_pais' => $item['nome_pais']],
                $item + ['atualizado_em' => now()],
            );
        }

        $mapa->invalidarCache();
        Log::info('GDELT atualizado', ['paises' => count($dados)]);
    }

    public function failed(Throwable $e): void
    {
        Log::error('AtualizarGdeltJob falhou', ['erro' => $e->getMessage()]);
    }
}
```

---

## 10. Controle de Acesso (Spatie Roles)

| Role | Permissões no Módulo 2 |
|------|------------------------|
| `assinante_essencial` | Acesso ao mapa e painel lateral (apenas regiões com eventos das últimas 48h) |
| `assinante_pro` | Idem — sem restrições adicionais neste módulo |
| `assinante_reservado` | Idem — sem restrições adicionais neste módulo |
| `admin` | Acesso total + visibilidade de metadados de debug (contagem GDELT vs M1) |

> O mapa é acessível a todos os assinantes autenticados. A diferenciação de acesso acontece no Módulo 3 (conteúdo da Biblioteca).

---

## 11. Error Handling

| Cenário | Tratamento |
|---------|-----------|
| GDELT API indisponível | Log de warning, mantém dados do cache anterior no banco, mapa exibe última versão |
| GDELT retorna payload inválido | Log de erro + skip, job marcado como failed, retry automático |
| View `mapa_intensidade` sem dados | Resposta vazia com `regioes: []`, frontend exibe mapa em cinza |
| Região não encontrada nos eventos | Resposta com `eventos: []`, painel exibe estado vazio graciosamente |
| Timeout na query da view | Timeout de 5s no DB, fallback para cache Redis se disponível |
| Frontend sem dados de intensidade | Mapa renderiza em cinza uniforme, spinner até carregar |

---

## 12. Checklist de Entrega

### Banco de Dados
- [ ] Tabela `gdelt_cache` criada com índice único por `nome_pais`
- [ ] View `mapa_intensidade` criada e retornando dados corretamente
- [ ] Query de intensidade do Módulo 1 (últimas 48h, agrupada por região) funcionando
- [ ] Teste com `SELECT * FROM mapa_intensidade LIMIT 20` retornando dados

### Coleta GDELT
- [ ] `GdeltFetcherService` retornando dados de ao menos 50 países
- [ ] Normalização do tom para escala 1–10 funcionando corretamente
- [ ] Cache do GDELT sendo atualizado pelo job
- [ ] Job `AtualizarGdeltJob` rodando nos minutos :30 sem conflito com Módulo 1
- [ ] Retry automático em caso de falha da API

### API Laravel
- [ ] `GET /api/mapa/intensidade` retornando dados combinados M1 + GDELT
- [ ] Cache Redis de 15 minutos funcionando (verificar com Redis CLI)
- [ ] `GET /api/mapa/regiao-eventos?regiao=...` retornando eventos corretos
- [ ] Parâmetro `regiao` validado (obrigatório, max 100 chars)
- [ ] HTTP 401 para requisições sem autenticação

### Mapa Interativo
- [ ] Arquivo `world-110m.json` baixado e acessível em `/public`
- [ ] Mapa renderizando todos os países sem erro de console
- [ ] Escala de cores aplicada corretamente por `intensidade_final`
- [ ] Hover com tooltip mostrando nome do país e intensidade
- [ ] Click disparando abertura do painel lateral

### Painel Lateral
- [ ] Animação de entrada e saída funcionando suavemente
- [ ] Eventos carregando corretamente para cada região clicada
- [ ] Cards com badge de impacto, título, análise e metadados
- [ ] Estado vazio quando não há eventos na região (mensagem amigável)
- [ ] Botão de fechar (×) funcionando corretamente

### Integração e Navegação
- [ ] Link "Mapa de Calor" adicionado à `TopNav` do dashboard
- [ ] Mapa atualizando automaticamente a cada 10 minutos
- [ ] Página responsiva em telas de 1280px ou mais
- [ ] Autenticação herdada do layout do Módulo 1
