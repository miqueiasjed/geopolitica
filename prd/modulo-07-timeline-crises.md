# PRD — Módulo 7: Linha do Tempo de Crises
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica  
**Versão:** 1.0  
**Data:** Abril 2026  
**Público:** Desenvolvedor Laravel Sênior implementando do zero

---

## 1. Visão Geral

O Módulo 7 é a **Linha do Tempo de Crises** — uma visualização horizontal e navegável das principais crises geopolíticas dos últimos 30 anos, combinada com eventos ativos do feed em tempo real.

O assinante clica em qualquer crise e um painel de detalhe exibe: o contexto geopolítico do evento, o impacto econômico global com métricas verificáveis, e o impacto específico no Brasil. É o único módulo do dashboard que conecta passado e presente numa mesma interface.

### O argumento central do canal visualizado

"O padrão se repete — só o cenário muda."

O assinante navega pela crise financeira de 2008, entende como ela se propagou, e na mesma tela vê os eventos ativos de hoje que apresentam padrões similares. Nenhum terminal financeiro ou plataforma de análise geopolítica faz isso.

### Duas faixas horizontais no mesmo eixo cronológico

| Faixa | Conteúdo | Fonte | Cor |
|---|---|---|---|
| **Superior** | Crises históricas pré-cadastradas (1990–hoje) | Tabela `crises_historicas` | Dourado `#C9B882` |
| **Inferior** | Eventos ativos do feed em tempo real | Tabela `eventos` (M1) | Branco `#E8E4DC` |

### Comportamento ao clicar

- **Crise histórica** → Painel de detalhe com contexto geopolítico, impacto global + métricas, impacto no Brasil + métricas, crises similares
- **Evento do feed** → Painel com análise da IA + link para a Biblioteca se houver briefing relacionado
- **Ambos** → Botão "Ver crises similares" filtra a linha do tempo por categoria

### Dados históricos são estáticos

Os dados das crises históricas são pré-cadastrados uma única vez via seeder + script de seed de conteúdo (Claude API). Não há custo mensal adicional de IA para este módulo após a configuração inicial.

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| **Backend framework** | Laravel 13 |
| **Banco de dados** | MySQL 8.x |
| **Cache** | Redis (crises históricas em cache por 24h) |
| **Autenticação** | Laravel Sanctum |
| **Autorização** | Spatie Laravel Permission |
| **IA (setup inicial)** | Claude API (Anthropic SDK PHP) — apenas para seed inicial |
| **Frontend** | React SPA (Vite + React + TypeScript + TailwindCSS) |
| **Visualização** | SVG nativo (sem lib externa) |
| **Estado/Fetch** | React Query (TanStack Query v5) |
| **Roteamento SPA** | React Router v7 |
| **Animações** | Framer Motion |

---

## 3. Dependências de Outros Módulos

| Módulo | O que usa |
|---|---|
| **Módulo 1** | Tabela `eventos` — faixa inferior da linha do tempo (eventos ativos) |
| **Módulo 3** | Tabela `conteudos` — briefings relacionados a cada crise (campo `content_slug`) |

**Sem dependências dos módulos 4, 5, 6.** Pode ser implementado imediatamente após M1 e M3.

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|---|---|
| **Prazo MVP** | 4 dias de desenvolvimento |
| **Custo de implementação** | R$ 8.000 – R$ 16.000 |
| **Custo mensal adicional** | R$ 0 (dados históricos são estáticos) |
| **Custo único de setup** | ~R$ 5–15 em chamadas à Claude API para seed das 25 crises |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── CriseHistoricaController.php   ← lista crises, detalhe
│   │       └── TimelineFeedController.php     ← eventos do feed formatados
│   └── Requests/
│       └── (sem requests específicos — apenas GETs com query params)
├── Models/
│   └── CriseHistorica.php
├── Services/
│   └── TimelineFeedService.php                ← formata eventos do M1 para a timeline
database/
├── migrations/
│   └── xxxx_create_crises_historicas_table.php
└── seeders/
    ├── CrisesHistoricasSeeder.php             ← insere as 25 crises (estrutura)
    └── CrisesConteudoSeeder.php               ← popula contexto via Claude API (único)
scripts/
└── seed-crisis-content.php                   ← artisan command de uso único
routes/
└── api.php
```

### 5.2 Models e Migrations (Schema Completo)

#### Migration: `crises_historicas`

```php
Schema::create('crises_historicas', function (Blueprint $table) {
    $table->id();

    // Identificação
    $table->string('titulo');                    // título completo
    $table->string('titulo_curto');              // versão curta para o marcador SVG (max 20 chars)
    $table->unsignedSmallInteger('ano');
    $table->unsignedTinyInteger('mes')->nullable(); // NULL = evento que durou o ano inteiro
    $table->string('data_label')->nullable();    // ex: "Set 2001", "Fev 2022"
    $table->enum('categoria', [
        'military', 'financial', 'energy', 'food', 'diplomatic', 'pandemic'
    ]);
    $table->string('regiao');                    // ex: "Oriente Médio", "Global"
    $table->unsignedSmallInteger('duracao_meses')->nullable(); // duração aproximada

    // Contexto geopolítico (gerado pela IA no seed)
    $table->longText('contexto_geopolitico')->nullable();
    $table->json('atores_principais')->nullable(); // array de strings

    // Impacto econômico global
    $table->text('impacto_global')->nullable();
    $table->json('metricas_globais')->nullable();  // ex: {"petroleo": "+180%", "trigo": "+40%"}

    // Impacto no Brasil
    $table->text('impacto_brasil')->nullable();
    $table->json('metricas_brasil')->nullable();   // ex: {"brl_usd": "+35%", "exportacoes": "-12%"}

    // Relacionamentos
    $table->json('similar_a')->nullable();        // array de IDs de crises similares
    $table->string('content_slug')->nullable();   // slug de briefing/tese relacionado no M3

    $table->timestamps();

    $table->index('ano');
    $table->index(['ano', 'mes']);
    $table->index('categoria');
    $table->index('regiao');
});
```

**Model `CriseHistorica`:**
```php
// app/Models/CriseHistorica.php
protected $table = 'crises_historicas';
protected $fillable = [
    'titulo', 'titulo_curto', 'ano', 'mes', 'data_label',
    'categoria', 'regiao', 'duracao_meses',
    'contexto_geopolitico', 'atores_principais',
    'impacto_global', 'metricas_globais',
    'impacto_brasil', 'metricas_brasil',
    'similar_a', 'content_slug',
];
protected $casts = [
    'atores_principais' => 'array',
    'metricas_globais'  => 'array',
    'metricas_brasil'   => 'array',
    'similar_a'         => 'array',
];

public function crisesSimulares(): Collection
{
    if (empty($this->similar_a)) {
        return collect();
    }
    return CriseHistorica::whereIn('id', $this->similar_a)
        ->select('id', 'titulo_curto', 'ano', 'categoria')
        ->get();
}

public function conteudoRelacionado(): ?object
{
    if (!$this->content_slug) return null;
    return \DB::table('conteudos')
        ->select('id', 'titulo', 'slug', 'tipo', 'publicado_em')
        ->where('slug', $this->content_slug)
        ->first();
}
```

---

#### Seeder: `CrisesHistoricasSeeder`

Insere as 25 crises históricas com estrutura (sem os textos de contexto — esses são gerados pelo command de seed único).

```php
// database/seeders/CrisesHistoricasSeeder.php
// As 25 crises pré-cadastradas:

$crises = [
    ['titulo' => 'Guerra do Golfo — invasão do Kuwait',        'titulo_curto' => 'Guerra do Golfo',       'ano' => 1990, 'mes' => 8,  'data_label' => 'Ago 1990', 'categoria' => 'military',   'regiao' => 'Oriente Médio'],
    ['titulo' => 'Crise Financeira Asiática',                  'titulo_curto' => 'Crise Asiática',        'ano' => 1997, 'mes' => 7,  'data_label' => 'Jul 1997', 'categoria' => 'financial',  'regiao' => 'Ásia'],
    ['titulo' => 'Crise Russa e calote da dívida',             'titulo_curto' => 'Calote Russo',          'ano' => 1998, 'mes' => 8,  'data_label' => 'Ago 1998', 'categoria' => 'financial',  'regiao' => 'Rússia'],
    ['titulo' => 'Desvalorização do Real',                     'titulo_curto' => 'Crise do Real',         'ano' => 1999, 'mes' => 1,  'data_label' => 'Jan 1999', 'categoria' => 'financial',  'regiao' => 'Brasil'],
    ['titulo' => 'Ataques de 11 de setembro',                  'titulo_curto' => '11 de setembro',        'ano' => 2001, 'mes' => 9,  'data_label' => 'Set 2001', 'categoria' => 'military',   'regiao' => 'EUA'],
    ['titulo' => 'Crise Argentina',                            'titulo_curto' => 'Crise Argentina',       'ano' => 2001, 'mes' => 12, 'data_label' => 'Dez 2001', 'categoria' => 'financial',  'regiao' => 'América do Sul'],
    ['titulo' => 'Invasão do Iraque',                          'titulo_curto' => 'Invasão do Iraque',     'ano' => 2003, 'mes' => 3,  'data_label' => 'Mar 2003', 'categoria' => 'military',   'regiao' => 'Oriente Médio'],
    ['titulo' => 'Furacão Katrina e choque energético',        'titulo_curto' => 'Katrina',               'ano' => 2005, 'mes' => 8,  'data_label' => 'Ago 2005', 'categoria' => 'energy',     'regiao' => 'EUA'],
    ['titulo' => 'Crise Subprime — início',                    'titulo_curto' => 'Início Subprime',       'ano' => 2007, 'mes' => 8,  'data_label' => 'Ago 2007', 'categoria' => 'financial',  'regiao' => 'EUA'],
    ['titulo' => 'Colapso Financeiro Global',                  'titulo_curto' => 'Colapso 2008',          'ano' => 2008, 'mes' => 9,  'data_label' => 'Set 2008', 'categoria' => 'financial',  'regiao' => 'Global'],
    ['titulo' => 'Primavera Árabe — início',                   'titulo_curto' => 'Primavera Árabe',       'ano' => 2010, 'mes' => 12, 'data_label' => 'Dez 2010', 'categoria' => 'diplomatic', 'regiao' => 'Oriente Médio'],
    ['titulo' => 'Crise da dívida soberana europeia',          'titulo_curto' => 'Crise da Dívida EU',    'ano' => 2011, 'mes' => 1,  'data_label' => 'Jan 2011', 'categoria' => 'financial',  'regiao' => 'Europa'],
    ['titulo' => 'Anexação da Crimeia pela Rússia',            'titulo_curto' => 'Crimeia',               'ano' => 2014, 'mes' => 3,  'data_label' => 'Mar 2014', 'categoria' => 'military',   'regiao' => 'Europa'],
    ['titulo' => 'Crise dos refugiados europeus',              'titulo_curto' => 'Refugiados Europa',     'ano' => 2015, 'mes' => 9,  'data_label' => 'Set 2015', 'categoria' => 'diplomatic', 'regiao' => 'Europa'],
    ['titulo' => 'Brexit',                                     'titulo_curto' => 'Brexit',                'ano' => 2016, 'mes' => 6,  'data_label' => 'Jun 2016', 'categoria' => 'diplomatic', 'regiao' => 'Europa'],
    ['titulo' => 'Guerra comercial EUA-China — início',        'titulo_curto' => 'Guerra Comercial EUA',  'ano' => 2018, 'mes' => 3,  'data_label' => 'Mar 2018', 'categoria' => 'diplomatic', 'regiao' => 'Global'],
    ['titulo' => 'Tensões no Estreito de Ormuz',               'titulo_curto' => 'Ormuz 2019',            'ano' => 2019, 'mes' => 6,  'data_label' => 'Jun 2019', 'categoria' => 'energy',     'regiao' => 'Oriente Médio'],
    ['titulo' => 'Pandemia de Covid-19',                       'titulo_curto' => 'Covid-19',              'ano' => 2020, 'mes' => 3,  'data_label' => 'Mar 2020', 'categoria' => 'pandemic',   'regiao' => 'Global'],
    ['titulo' => 'Crise energética global pós-Covid',          'titulo_curto' => 'Crise Energética 21',   'ano' => 2021, 'mes' => 9,  'data_label' => 'Set 2021', 'categoria' => 'energy',     'regiao' => 'Global'],
    ['titulo' => 'Invasão russa da Ucrânia',                   'titulo_curto' => 'Invasão Ucrânia',       'ano' => 2022, 'mes' => 2,  'data_label' => 'Fev 2022', 'categoria' => 'military',   'regiao' => 'Europa'],
    ['titulo' => 'Choque de fertilizantes e alimentos',        'titulo_curto' => 'Choque Alimentar',      'ano' => 2022, 'mes' => 4,  'data_label' => 'Abr 2022', 'categoria' => 'food',       'regiao' => 'Global'],
    ['titulo' => 'Conflito Israel-Hamas',                      'titulo_curto' => 'Israel-Hamas',          'ano' => 2023, 'mes' => 10, 'data_label' => 'Out 2023', 'categoria' => 'military',   'regiao' => 'Oriente Médio'],
    ['titulo' => 'Tensões no Mar Vermelho — Houthis',          'titulo_curto' => 'Houthis Mar Vermelho',  'ano' => 2024, 'mes' => 1,  'data_label' => 'Jan 2024', 'categoria' => 'military',   'regiao' => 'Oriente Médio'],
    ['titulo' => 'Escalada Irã-Israel',                        'titulo_curto' => 'Irã-Israel',            'ano' => 2025, 'mes' => 4,  'data_label' => 'Abr 2025', 'categoria' => 'military',   'regiao' => 'Oriente Médio'],
    ['titulo' => 'Guerra do Irã — EUA e Israel',               'titulo_curto' => 'Guerra do Irã',         'ano' => 2026, 'mes' => 1,  'data_label' => 'Jan 2026', 'categoria' => 'military',   'regiao' => 'Oriente Médio'],
];
```

---

#### Command de Seed Único: `SeedConteudoCrises`

Este command é executado **uma única vez** na configuração inicial. Não é um cron job.

```bash
php artisan crises:seed-conteudo
```

```php
// app/Console/Commands/SeedConteudoCrises.php
// Busca crises sem contexto_geopolitico → chama Claude API → atualiza registro

// Prompt para cada crise:
$prompt = "Você é um analista geopolítico sênior.
Gere o conteúdo para a crise: {$crise->titulo} ({$crise->ano}).

Retorne APENAS JSON com esta estrutura:
{
  \"contexto_geopolitico\": \"200-250 palavras...\",
  \"atores_principais\": [\"ator1\", \"ator2\"],
  \"impacto_global\": \"150-200 palavras...\",
  \"metricas_globais\": {\"indicador\": \"variação verificável\"},
  \"impacto_brasil\": \"100-150 palavras...\",
  \"metricas_brasil\": {\"indicador\": \"variação verificável\"}
}

Use apenas fatos verificáveis. Para métricas, use apenas dados verificáveis em fontes primárias.";
```

---

### 5.3 Services

#### `TimelineFeedService`
**Responsabilidades:**
- Buscar eventos da tabela `eventos` (M1) dos últimos N dias
- Filtrar por `pontuacao_impacto >= 6` (apenas eventos relevantes na timeline)
- Retornar apenas os campos necessários para a visualização SVG
- Ordenar por `publicado_em` ascendente (para posicionamento correto no eixo)

**Métodos principais:**
```php
public function buscarEventosTimeline(int $diasAtras = 90): Collection
public function formatarParaTimeline(Evento $evento): array
```

---

### 5.4 FormRequests

Não há FormRequests para este módulo — todas as rotas são `GET` com query parameters opcionais. A validação é feita diretamente no controller com `$request->validate()`.

---

### 5.5 Controllers e Rotas

**`CriseHistoricaController`:**
```php
// GET /api/crises — lista com filtros
public function index(Request $request): JsonResponse
// Query params: from (ano), to (ano), cat (categoria), region (string)
// Retorna: id, titulo, titulo_curto, ano, mes, data_label, categoria, regiao, duracao_meses, similar_a, content_slug

// GET /api/crises/{id} — detalhe completo
public function show(int $id): JsonResponse
// Retorna: crise completa + conteúdo relacionado da Biblioteca + crises similares
```

**`TimelineFeedController`:**
```php
// GET /api/timeline-feed — eventos do feed para a faixa inferior
public function index(Request $request): JsonResponse
// Query params: days (padrão: 90)
// Retorna: id, titulo, regiao, pontuacao_impacto, label_impacto, publicado_em, url_fonte, analise_ia
```

**`routes/api.php`:**
```php
Route::middleware(['auth:sanctum', 'role:assinante_essencial|assinante_pro|assinante_reservado|admin'])
    ->group(function () {

        // Crises históricas
        Route::get('/crises',      [CriseHistoricaController::class, 'index']);
        Route::get('/crises/{id}', [CriseHistoricaController::class, 'show']);

        // Feed para a linha do tempo
        Route::get('/timeline-feed', [TimelineFeedController::class, 'index']);
    });
```

---

## 6. Endpoints da API

### `GET /api/crises`
**Middleware:** auth:sanctum + role  
**Query Params:**
- `from` — ano inicial (ex: `2000`)
- `to` — ano final (ex: `2010`)
- `cat` — categoria: `military`, `financial`, `energy`, `food`, `diplomatic`, `pandemic`
- `region` — filtro parcial por região (ex: `Oriente`)

**Resposta:**
```json
{
  "crises": [
    {
      "id": 10,
      "titulo": "Colapso Financeiro Global",
      "titulo_curto": "Colapso 2008",
      "ano": 2008,
      "mes": 9,
      "data_label": "Set 2008",
      "categoria": "financial",
      "regiao": "Global",
      "duracao_meses": 18,
      "similar_a": [7, 8],
      "content_slug": null
    }
  ]
}
```

---

### `GET /api/crises/{id}`
**Middleware:** auth:sanctum + role  
**Params:** `id` (integer)  
**Resposta:**
```json
{
  "crise": {
    "id": 10,
    "titulo": "Colapso Financeiro Global",
    "titulo_curto": "Colapso 2008",
    "ano": 2008,
    "mes": 9,
    "data_label": "Set 2008",
    "categoria": "financial",
    "regiao": "Global",
    "contexto_geopolitico": "A crise financeira de 2008 teve origem...",
    "atores_principais": ["Lehman Brothers", "FED", "BCE", "FMI"],
    "impacto_global": "O colapso do sistema financeiro americano...",
    "metricas_globais": {
      "S&P 500": "-57%",
      "petroleo": "-75%",
      "comercio_global": "-12%"
    },
    "impacto_brasil": "O Brasil foi atingido com relativo atraso...",
    "metricas_brasil": {
      "brl_usd": "+60%",
      "ibovespa": "-42%",
      "pib_2009": "-0.1%"
    }
  },
  "crises_similares": [
    { "id": 7, "titulo_curto": "Início Subprime", "ano": 2007, "categoria": "financial" }
  ],
  "conteudo_relacionado": null
}
```

---

### `GET /api/timeline-feed`
**Middleware:** auth:sanctum + role  
**Query Params:** `days` (integer, padrão: 90)  
**Resposta:**
```json
{
  "eventos": [
    {
      "id": 881,
      "titulo": "Irã fecha Estreito de Ormuz em retaliação a sanções",
      "regiao": "Oriente Médio",
      "pontuacao_impacto": 9,
      "label_impacto": "Crítico",
      "categorias": ["military", "energy"],
      "publicado_em": "2026-04-13T14:00:00Z",
      "url_fonte": "https://reuters.com/...",
      "analise_ia": "O fechamento do Estreito de Ormuz..."
    }
  ]
}
```

---

## 7. Frontend React

### Componentes Principais

```
src/
├── components/
│   ├── timeline/
│   │   ├── LinhaDoTempoSvg.tsx        ← visualização SVG com duas faixas
│   │   ├── FiltrosTimeline.tsx        ← filtros de décadas e categorias
│   │   ├── PainelCrise.tsx            ← painel deslizante de detalhe
│   │   ├── MetricasImpacto.tsx        ← pills de métricas econômicas
│   │   └── LegendaCategoria.tsx       ← legenda de cores por categoria
├── hooks/
│   ├── useCrises.ts                   ← React Query para crises históricas
│   ├── useCriseDetalhe.ts             ← React Query para detalhe de uma crise
│   └── useTimelineFeed.ts             ← React Query para eventos do feed
├── pages/
│   └── LinhaDoTempoPage.tsx           ← /linha-do-tempo
└── services/
    └── timelineApi.ts
```

### `LinhaDoTempoPage.tsx`
Página principal com:
1. Header (título + instrução de uso)
2. `FiltrosTimeline` (décadas + categorias)
3. `LinhaDoTempoSvg` (visualização principal)
4. `LegendaCategoria`
5. `PainelCrise` (fixed right, abre ao clicar)

### `LinhaDoTempoSvg.tsx`
Visualização SVG renderizada no browser. Principais características:
- Largura total: `(ANO_FIM - ANO_INICIO) * PX_POR_ANO` pixels (120px/ano)
- Container com `overflow: hidden`, scroll via drag do mouse
- Eixo central horizontal (linha branca 10% opacidade)
- Labels de ano visíveis no eixo, calculados dinamicamente pela janela visível
- **Faixa superior** (y=60): círculos coloridos por categoria + labels de título
- **Faixa inferior** (y=210): círculos brancos com opacidade por `pontuacao_impacto`
- Linhas verticais tracejadas ligando marcadores ao eixo central

```typescript
// Constantes de layout
const ANO_INICIO = 1990;
const ANO_FIM    = new Date().getFullYear() + 1;
const PX_POR_ANO = 120;
const LARGURA_TOTAL = (ANO_FIM - ANO_INICIO) * PX_POR_ANO;
const ALTURA_SVG    = 280;
const Y_EIXO        = 140;
const Y_CRISES      = 60;   // faixa superior — crises históricas
const Y_FEED        = 210;  // faixa inferior — eventos ativos

// Converter ano + mês em posição X
function anoParaX(ano: number, mes: number = 0): number {
  return (ano - ANO_INICIO + mes / 12) * PX_POR_ANO;
}
```

**Drag handling (sem libs externas):**
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [scrollX, setScrollX] = useState(0);
const isDragging = useRef(false);
const dragStartX = useRef(0);
const dragStartScroll = useRef(0);

// mousedown → isDragging = true, captura X inicial
// mousemove → se dragging, calcula delta e atualiza scrollX
// mouseup → isDragging = false
// touch events equivalentes para mobile
```

**Ao inicializar:** posicionar automaticamente no ano atual - 3 anos (para mostrar contexto recente).

### Cores por categoria
```typescript
const CORES_CATEGORIA: Record<string, string> = {
  military:   '#EF4444', // vermelho
  financial:  '#FB923C', // laranja
  energy:     '#FACC15', // amarelo
  food:       '#4ade80', // verde
  diplomatic: '#60A5FA', // azul
  pandemic:   '#C084FC', // roxo
  current:    '#E8E4DC', // branco — eventos do feed
};
```

### `FiltrosTimeline.tsx`
Barra de filtros com dois grupos:
1. **Décadas:** 1990s / 2000s / 2010s / 2020s — ao clicar, navega para o início da década
2. **Categorias:** todas as 6 categorias + "Todas" — ao clicar, filtra crises por categoria

```typescript
// Ao clicar em década: scrollToYear(decada.inicio) + atualiza filtro de ano
// Ao clicar em categoria: atualiza state de categoria, passa como prop para LinhaDoTempoSvg
```

### `PainelCrise.tsx`
Painel deslizante fixo na direita (w-[480px]) com animação via Framer Motion:
- `initial={{ x: "100%" }}` → `animate={{ x: 0 }}`
- Fecha ao clicar no `×` ou ao clicar fora

**Seções do painel (crise histórica):**
1. Header: tipo de categoria + data + título
2. Contexto geopolítico (texto + atores em pills)
3. Impacto econômico global + `MetricasImpacto`
4. Impacto no Brasil (fundo dourado destacado) + `MetricasImpacto` com prop `highlight`
5. Crises similares (lista de links)
6. Conteúdo relacionado da Biblioteca (link para `/biblioteca/{slug}`)

**Seções do painel (evento do feed):**
1. Header: região + data + título
2. Análise da IA
3. Link para a fonte original
4. Link para a Biblioteca (se houver briefing relacionado)

### `MetricasImpacto.tsx`
```typescript
// Exibe objeto de métricas como pills
// { "S&P 500": "-57%", "petroleo": "-75%" }
// Prop highlight → borda e fundo dourado (métricas do Brasil)
// Sem highlight → borda branca 10% opacidade
```

### Fluxo de dados com React Query

```typescript
// LinhaDoTempoPage — carregamento inicial paralelo
function LinhaDoTempoPage() {
  const [filtros, setFiltros] = useState({ de: 1990, ate: 2030, cat: 'all' });
  const [criseIdSelecionada, setCriseIdSelecionada] = useState<number | null>(null);
  
  // Crises históricas — carregam com os filtros
  const { data: crisesData } = useQuery({
    queryKey: ['crises', filtros],
    queryFn: () => timelineApi.buscarCrises(filtros),
    staleTime: 24 * 60 * 60 * 1000, // 24h — dados estáticos
  });
  
  // Feed da timeline — carrega uma vez, refresca a cada hora
  const { data: feedData } = useQuery({
    queryKey: ['timeline-feed'],
    queryFn: () => timelineApi.buscarFeed(90),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });
  
  // Detalhe da crise selecionada — lazy load ao clicar
  const { data: detalhe } = useQuery({
    queryKey: ['crise', criseIdSelecionada],
    queryFn: () => timelineApi.buscarDetalhe(criseIdSelecionada!),
    enabled: !!criseIdSelecionada,
    staleTime: Infinity, // dados imutáveis
  });
}
```

---

## 8. Agendamentos (Laravel Scheduler)

**Este módulo não possui agendamentos recorrentes.** Os dados históricos são estáticos e populados uma única vez.

O único agendamento indireto é a query ao endpoint `/api/timeline-feed`, que usa dados do M1 (feed de eventos). O scheduler do M1 já cuida da atualização desses dados.

```php
// Não há Schedule::command para este módulo.
// O command SeedConteudoCrises é executado manualmente uma única vez:
// php artisan crises:seed-conteudo
```

---

## 9. Jobs / Queues

**Este módulo não utiliza Jobs/Queues em produção.**

O seed de conteúdo é executado via Artisan command síncrono uma única vez durante a configuração. Cada chamada à Claude API inclui uma pausa de 2s para controle de rate limit.

---

## 10. Controle de Acesso

| Role | Pode ver linha do tempo | Pode ver crises históricas | Pode ver eventos do feed | Pode ver detalhe completo |
|---|---|---|---|---|
| `assinante_essencial` | Sim | Sim (todas as 25 crises) | Sim (últimos 90 dias) | Sim (contexto + impacto global) |
| `assinante_pro` | Sim | Sim | Sim | Sim (completo + métricas Brasil) |
| `assinante_reservado` | Sim | Sim | Sim | Sim (completo + crises similares) |
| `admin` | Sim | Sim | Sim | Sim |

**Nota:** O controle de acesso é uniforme para este módulo — todos os assinantes têm acesso completo à linha do tempo. Não há conteúdo bloqueado por plano neste módulo.

---

## 11. Error Handling

| Situação | HTTP | Código interno | Mensagem |
|---|---|---|---|
| Não autenticado | 401 | `NAO_AUTENTICADO` | "Autenticação necessária." |
| Sem permissão de role | 403 | `SEM_PERMISSAO` | "Seu plano não permite acesso a este recurso." |
| Crise não encontrada | 404 | `CRISE_NAO_ENCONTRADA` | "Crise não encontrada." |
| Parâmetro `from` inválido | 422 | `PARAMETRO_INVALIDO` | "O parâmetro 'from' deve ser um ano válido (ex: 2000)." |
| Parâmetro `cat` inválido | 422 | `CATEGORIA_INVALIDA` | "Categoria inválida. Use: military, financial, energy, food, diplomatic, pandemic." |

**Cache das crises históricas (Redis):**
```php
// No CriseHistoricaController::index() — cachear por 24h
// A query raramente muda — dados são estáticos
$crises = Cache::remember("crises_{$cacheKey}", 86400, function () use ($filtros) {
    return $this->aplicarFiltros(CriseHistorica::query(), $filtros)->get();
});

// No CriseHistoricaController::show() — cachear por 7 dias
$crise = Cache::remember("crise_{$id}", 604800, function () use ($id) {
    return CriseHistorica::findOrFail($id);
});
```

---

## 12. Checklist de Entrega

### Banco de dados e seed
- [ ] Migration `crises_historicas` executada com todos os campos
- [ ] `CrisesHistoricasSeeder` executado — 25 crises inseridas com `titulo`, `ano`, `categoria`, `regiao`
- [ ] Command `php artisan crises:seed-conteudo` executado uma vez — todos os campos de contexto e impacto preenchidos
- [ ] Campo `similar_a` configurado manualmente para os grupos óbvios (ex: Subprime ↔ Colapso 2008 ↔ Crise Europeia)
- [ ] Índices criados corretamente

### API
- [ ] `GET /api/crises` retornando com filtros de `from`, `to`, `cat`, `region`
- [ ] `GET /api/crises/{id}` retornando detalhe + crises similares + conteúdo relacionado
- [ ] `GET /api/timeline-feed` retornando eventos do M1 com `pontuacao_impacto >= 6`
- [ ] Cache Redis configurado para crises históricas (24h) e detalhe (7 dias)

### Componentes Frontend
- [ ] `LinhaDoTempoSvg` renderizando linha do tempo SVG com duas faixas
- [ ] Drag horizontal funcionando com mouse e touch
- [ ] Marcadores de crises históricas com cor por categoria
- [ ] Marcadores de eventos do feed com opacidade por `pontuacao_impacto`
- [ ] Labels de ano visíveis no eixo central
- [ ] Texto truncado nos marcadores (max ~16 chars)
- [ ] `FiltrosTimeline` com décadas e categorias funcionando
- [ ] Scroll para ano específico ao clicar na década

### Painel de detalhe
- [ ] `PainelCrise` abrindo com animação suave ao clicar numa crise
- [ ] Seção de contexto geopolítico com atores em pills
- [ ] `MetricasImpacto` exibindo métricas globais
- [ ] `MetricasImpacto` com `highlight=true` para métricas do Brasil
- [ ] Crises similares listadas corretamente
- [ ] Link para conteúdo relacionado da Biblioteca quando disponível
- [ ] Painel de evento do feed com análise da IA e link para fonte
- [ ] Painel fechando ao clicar no `×`

### Integração
- [ ] "Linha do Tempo" adicionada à navegação do dashboard
- [ ] Página visível para todos os planos
- [ ] Posicionamento inicial no ano atual - 3 anos
- [ ] Performance aceitável com 25 crises + 100 eventos no SVG

---

## Observação: Arquitetura SVG vs Biblioteca de Terceiros

O `LinhaDoTempoSvg` é implementado em **SVG nativo** sem dependências externas (sem D3.js, sem Recharts). Isso garante:
- Controle total sobre o visual
- Sem conflito com o sistema de design
- Bundle menor
- Sem atualizações de dependências que quebram comportamento

A única dependência externa de animação é o **Framer Motion** (já usado no projeto para o painel deslizante). O drag é implementado com eventos DOM nativos do React.
