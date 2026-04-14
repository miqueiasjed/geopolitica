# PRD — Módulo 8: Radar de Eleições
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica  
**Versão:** 1.0  
**Data:** Abril 2026  
**Público:** Desenvolvedor Laravel Sênior implementando do zero

---

## 1. Visão Geral

O Módulo 8 é o **Radar de Eleições** — um calendário visual que exibe as principais eleições globais organizadas por mês, com painel de detalhe ao clicar em cada uma. O assinante vê de um relance quais eleições estão chegando nos próximos 12 meses, em quais países e com qual relevância geopolítica para o Brasil.

### Por que eleições importam para o canal

Eleições mudam orientações geopolíticas, rompem alianças e reconfiguram fluxos comerciais. A eleição de Milei na Argentina reconfigurou as relações bilaterais com o Brasil. A eleição de Trump em 2024 relançou a guerra comercial com a China. A eleição europeia de 2024 sinalizou a ascensão do populismo que precedeu instabilidade. Antecipar esses movimentos é exatamente o que o canal entrega — e o Radar torna isso visual.

### Modelo de dados simples e operação manual

As eleições são cadastradas manualmente pelo administrador via painel admin — **o mesmo painel do Módulo 3** (Biblioteca). O módulo não depende de coleta automática, IA ou integrações externas. Custo mensal adicional: R$ 0.

### Sistema de relevância visual

Um sistema de três níveis (Alta, Média, Baixa) determina o destaque visual de cada eleição na grade:

| Relevância | Cor | Critério |
|---|---|---|
| **Alta** | Vermelho `#EF4444` | Eleição que pode mudar fluxos comerciais, alianças ou riscos setoriais para o Brasil |
| **Média** | Amarelo `#FACC15` | Eleição com impacto indireto ou setorial para o Brasil |
| **Baixa** | Branco 20% | Eleição de contexto, pouca influência direta sobre o Brasil |

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| **Backend framework** | Laravel 13 |
| **Banco de dados** | MySQL 8.x |
| **Cache** | Redis (lista de eleições em cache por 1h) |
| **Autenticação** | Laravel Sanctum |
| **Autorização** | Spatie Laravel Permission |
| **Frontend** | React SPA (Vite + React + TypeScript + TailwindCSS) |
| **Estado/Fetch** | React Query (TanStack Query v5) |
| **Roteamento SPA** | React Router v7 |
| **Animações** | Framer Motion |

---

## 3. Dependências de Outros Módulos

| Módulo | O que usa |
|---|---|
| **Módulo 3** | Painel admin já existente — reutilizado para cadastro de eleições. Tabela `conteudos` para conteúdo relacionado via `content_slug`. |

**Não depende dos Módulos 4, 5, 6 ou 7.** Pode ser implementado em paralelo após o M3.

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|---|---|
| **Prazo MVP** | 3 dias de desenvolvimento |
| **Custo de implementação** | R$ 5.000 – R$ 10.000 |
| **Custo mensal adicional** | R$ 0 (dados são estáticos — cadastro manual) |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── EleicaoController.php           ← GET público: lista e detalhe
│   │       └── Admin/
│   │           └── EleicaoAdminController.php  ← CRUD admin: criar, editar, excluir
│   ├── Requests/
│   │   ├── CriarEleicaoRequest.php
│   │   └── AtualizarEleicaoRequest.php
│   └── Middleware/
│       └── (reutiliza VerificarAdmin do M3)
├── Models/
│   └── Eleicao.php
├── Services/
│   └── EleicaoService.php                      ← lógica de filtros e agrupamento por mês
database/
├── migrations/
│   └── xxxx_create_eleicoes_table.php
└── seeders/
    └── EleicoesIniciaisSeeder.php              ← 15 eleições de 2026
routes/
└── api.php
```

### 5.2 Models e Migrations (Schema Completo)

#### Migration: `eleicoes`

```php
Schema::create('eleicoes', function (Blueprint $table) {
    $table->id();

    // Identificação do país
    $table->string('nome_pais');                    // ex: "Alemanha", "Brasil"
    $table->string('codigo_pais', 2)->nullable();   // ISO 3166-1 alpha-2 (ex: "DE", "BR")
    $table->string('bandeira_emoji', 10)->nullable(); // ex: "🇩🇪"

    // Tipo da eleição
    $table->enum('tipo_eleicao', [
        'presidential',   // presidencial
        'parliamentary',  // parlamentar
        'midterm',        // meio de mandato
        'regional',       // regional / estadual
        'referendum',     // referendo
    ]);

    // Data
    $table->date('data_eleicao');                   // data precisa ou estimada
    $table->string('data_label');                   // ex: "28 de setembro de 2026"
    $table->boolean('data_confirmada')->default(true); // FALSE = data estimada

    // Relevância e conteúdo
    $table->enum('relevancia', ['high', 'medium', 'low'])->default('medium');
    $table->text('contexto')->nullable();           // contexto político do país
    $table->text('relevancia_brasil')->nullable();  // por que importa para o Brasil
    $table->json('candidatos')->nullable();         // array de candidatos
    // ex: [{"nome": "X", "partido": "Y", "posicao": "favorito"}]

    // Relacionamento com a Biblioteca (M3)
    $table->string('content_slug')->nullable();     // slug do briefing relacionado

    // Controle
    $table->boolean('publicado')->default(true);
    $table->text('resultado')->nullable();          // preenchido após a eleição

    $table->timestamps(); // created_at e updated_at

    $table->index(['data_eleicao']);
    $table->index('relevancia');
    $table->index(['publicado', 'data_eleicao']);
});
```

**Model `Eleicao`:**
```php
// app/Models/Eleicao.php
protected $table = 'eleicoes';
protected $fillable = [
    'nome_pais', 'codigo_pais', 'bandeira_emoji',
    'tipo_eleicao', 'data_eleicao', 'data_label', 'data_confirmada',
    'relevancia', 'contexto', 'relevancia_brasil',
    'candidatos', 'content_slug', 'publicado', 'resultado',
];
protected $casts = [
    'data_eleicao'    => 'date',
    'data_confirmada' => 'boolean',
    'candidatos'      => 'array',
    'publicado'       => 'boolean',
];

// Accessor: label do tipo em português
public function getTipoLabelAttribute(): string
{
    return [
        'presidential'  => 'Presidencial',
        'parliamentary' => 'Parlamentar',
        'midterm'       => 'Meio de mandato',
        'regional'      => 'Regional',
        'referendum'    => 'Referendo',
    ][$this->tipo_eleicao] ?? $this->tipo_eleicao;
}

// Accessor: label da relevância em português
public function getRelevanciaPtAttribute(): string
{
    return [
        'high'   => 'Alta relevância para o Brasil',
        'medium' => 'Média relevância para o Brasil',
        'low'    => 'Baixa relevância para o Brasil',
    ][$this->relevancia] ?? $this->relevancia;
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

#### Seeder: `EleicoesIniciaisSeeder`

Eleições mais relevantes de 2026 para cadastro inicial via `php artisan db:seed --class=EleicoesIniciaisSeeder`.

```php
// Amostra das eleições iniciais:
$eleicoes = [
    [
        'nome_pais'       => 'Brasil',
        'codigo_pais'     => 'BR',
        'bandeira_emoji'  => '🇧🇷',
        'tipo_eleicao'    => 'midterm',
        'data_eleicao'    => '2026-10-04',
        'data_label'      => '4 de outubro de 2026',
        'data_confirmada' => true,
        'relevancia'      => 'high',
        'contexto'        => 'Eleições municipais de 2º turno — termômetro nacional para 2028.',
        'relevancia_brasil' => 'Resultado direto na governança local e indicativo político para 2028.',
        'candidatos'      => null,
        'publicado'       => true,
    ],
    [
        'nome_pais'       => 'Estados Unidos',
        'codigo_pais'     => 'US',
        'bandeira_emoji'  => '🇺🇸',
        'tipo_eleicao'    => 'midterm',
        'data_eleicao'    => '2026-11-03',
        'data_label'      => '3 de novembro de 2026',
        'data_confirmada' => true,
        'relevancia'      => 'high',
        'contexto'        => 'Eleições de meio de mandato para toda a Câmara e 1/3 do Senado.',
        'relevancia_brasil' => 'Resultado pode reconfigurar a política comercial americana com impacto direto no agro brasileiro.',
        'candidatos'      => null,
        'publicado'       => true,
    ],
    [
        'nome_pais'       => 'Argentina',
        'codigo_pais'     => 'AR',
        'bandeira_emoji'  => '🇦🇷',
        'tipo_eleicao'    => 'parliamentary',
        'data_eleicao'    => '2026-10-25',
        'data_label'      => '25 de outubro de 2026',
        'data_confirmada' => true,
        'relevancia'      => 'high',
        'contexto'        => 'Eleições legislativas parciais — teste da força política de Milei.',
        'relevancia_brasil' => 'Resultado indica a trajetória das relações bilaterais Brasil-Argentina.',
        'candidatos'      => null,
        'publicado'       => true,
    ],
    // ... demais eleições: Alemanha, França, Irã, Chile, Colômbia, Japão, Índia, Turquia, Venezuela, Canadá, Austrália, Portugal
];
```

**Lista completa de eleições iniciais 2026:**

| País | Tipo | Data estimada | Relevância |
|---|---|---|---|
| Alemanha | Parlamentar (Bundestag) | Fev 2026 (realizada) | Alta |
| França | Presidencial | Abr 2027 | Alta |
| Irã | Presidencial (pós-guerra) | A confirmar 2026 | Alta |
| Chile | Presidencial | Nov 2026 | Média |
| Colômbia | Parlamentar (regional) | Out 2026 | Média |
| Japão | Parlamentar (Câmara) | Out 2026 | Média |
| Brasil | Municipal (2º turno) | Out 2026 | Alta |
| EUA | Eleições de meio de mandato | Nov 2026 | Alta |
| Argentina | Legislativa (parcial) | Out 2026 | Alta |
| Índia | Estaduais (Bihar) | Out/Nov 2026 | Média |
| Turquia | Municipal | Mar 2026 | Média |
| Venezuela | Parlamentar | A confirmar 2026 | Alta |
| Canadá | Federal | Jan 2026 (realizada) | Média |
| Austrália | Federal | Mai 2026 (realizada) | Baixa |
| Portugal | Presidencial | Jan 2026 (realizada) | Baixa |

---

### 5.3 Services

#### `EleicaoService`
**Responsabilidades:**
- Construir queries com filtros de `view` (upcoming/past), `relevancia` e `mes`
- Agrupar eleições por mês para o formato de calendário
- Ordenar eleições dentro de cada mês por relevância (alta → média → baixa)
- Calcular os próximos 12 meses a partir da data atual
- Buscar conteúdo relacionado da tabela `conteudos` quando `content_slug` não é nulo

**Métodos principais:**
```php
public function listar(array $filtros): Collection
public function detalhe(int $id): array    // retorna ['eleicao' => ..., 'conteudo_relacionado' => ...]
public function agruparPorMes(Collection $eleicoes): array
private function aplicarFiltros(Builder $query, array $filtros): Builder
```

---

### 5.4 FormRequests

**`CriarEleicaoRequest`:**
```php
public function authorize(): bool
{
    return $this->user()->hasRole('admin');
}

public function rules(): array
{
    return [
        'nome_pais'         => ['required', 'string', 'max:100'],
        'codigo_pais'       => ['nullable', 'string', 'size:2'],
        'bandeira_emoji'    => ['nullable', 'string', 'max:10'],
        'tipo_eleicao'      => ['required', Rule::in(['presidential', 'parliamentary', 'midterm', 'regional', 'referendum'])],
        'data_eleicao'      => ['required', 'date'],
        'data_label'        => ['required', 'string', 'max:50'],
        'data_confirmada'   => ['boolean'],
        'relevancia'        => ['required', Rule::in(['high', 'medium', 'low'])],
        'contexto'          => ['nullable', 'string'],
        'relevancia_brasil' => ['nullable', 'string'],
        'candidatos'        => ['nullable', 'json'],
        'content_slug'      => ['nullable', 'string', 'max:100'],
    ];
}

public function messages(): array
{
    return [
        'tipo_eleicao.in'  => 'Tipo de eleição inválido. Use: presidential, parliamentary, midterm, regional, referendum.',
        'relevancia.in'    => 'Relevância inválida. Use: high, medium, low.',
        'candidatos.json'  => 'O campo candidatos deve ser um JSON válido.',
        'data_eleicao.date' => 'Data inválida. Use o formato YYYY-MM-DD.',
    ];
}
```

**`AtualizarEleicaoRequest`:**
```php
// Mesmas rules, mas todos os campos são nullable (PATCH parcial)
// Adiciona rule especial para 'resultado':
public function rules(): array
{
    return [
        'nome_pais'         => ['sometimes', 'string', 'max:100'],
        'tipo_eleicao'      => ['sometimes', Rule::in(['presidential', 'parliamentary', 'midterm', 'regional', 'referendum'])],
        'data_eleicao'      => ['sometimes', 'date'],
        'data_label'        => ['sometimes', 'string', 'max:50'],
        'data_confirmada'   => ['sometimes', 'boolean'],
        'relevancia'        => ['sometimes', Rule::in(['high', 'medium', 'low'])],
        'contexto'          => ['nullable', 'string'],
        'relevancia_brasil' => ['nullable', 'string'],
        'candidatos'        => ['nullable', 'json'],
        'content_slug'      => ['nullable', 'string', 'max:100'],
        'resultado'         => ['nullable', 'string', 'max:500'],
        'publicado'         => ['sometimes', 'boolean'],
    ];
}
```

---

### 5.5 Controllers e Rotas

**`EleicaoController`** (leitura pública para assinantes):
```php
// app/Http/Controllers/Api/EleicaoController.php

public function __construct(
    private readonly EleicaoService $eleicaoService
) {}

// GET /api/eleicoes — lista com filtros
public function index(Request $request): JsonResponse
{
    $request->validate([
        'view'      => ['nullable', Rule::in(['upcoming', 'past'])],
        'relevancia' => ['nullable', Rule::in(['high', 'medium', 'low'])],
        'mes'       => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
    ]);

    $eleicoes = $this->eleicaoService->listar($request->only(['view', 'relevancia', 'mes']));
    return response()->json(['eleicoes' => $eleicoes]);
}

// GET /api/eleicoes/{id} — detalhe completo
public function show(int $id): JsonResponse
{
    $dados = $this->eleicaoService->detalhe($id);
    return response()->json($dados);
}
```

**`EleicaoAdminController`** (CRUD para admin):
```php
// app/Http/Controllers/Api/Admin/EleicaoAdminController.php

// GET /api/admin/eleicoes — lista todas (incluindo despublicadas)
public function index(Request $request): JsonResponse

// POST /api/admin/eleicoes — criar nova eleição
public function store(CriarEleicaoRequest $request): JsonResponse

// PATCH /api/admin/eleicoes/{id} — editar (incluindo resultado pós-eleição)
public function update(AtualizarEleicaoRequest $request, int $id): JsonResponse

// DELETE /api/admin/eleicoes/{id} — soft delete (publicado = false)
public function destroy(int $id): JsonResponse
```

**`routes/api.php`:**
```php
// Rotas de leitura para todos os assinantes autenticados
Route::middleware(['auth:sanctum', 'role:assinante_essencial|assinante_pro|assinante_reservado|admin'])
    ->group(function () {
        Route::get('/eleicoes',       [EleicaoController::class, 'index']);
        Route::get('/eleicoes/{id}',  [EleicaoController::class, 'show']);
    });

// Rotas de escrita exclusivas para admin
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/eleicoes',           [EleicaoAdminController::class, 'index']);
        Route::post('/eleicoes',          [EleicaoAdminController::class, 'store']);
        Route::patch('/eleicoes/{id}',    [EleicaoAdminController::class, 'update']);
        Route::delete('/eleicoes/{id}',   [EleicaoAdminController::class, 'destroy']);
    });
```

---

## 6. Endpoints da API

### `GET /api/eleicoes`
**Middleware:** auth:sanctum + role assinante ou admin  
**Query Params:**
- `view` — `upcoming` (padrão, próximas a partir de hoje) ou `past` (últimas 20 realizadas)
- `relevancia` — `high`, `medium`, `low` (opcional)
- `mes` — ex: `2026-09` (opcional, filtra por mês específico)

**Resposta:**
```json
{
  "eleicoes": [
    {
      "id": 3,
      "nome_pais": "Estados Unidos",
      "codigo_pais": "US",
      "bandeira_emoji": "🇺🇸",
      "tipo_eleicao": "midterm",
      "tipo_label": "Meio de mandato",
      "data_eleicao": "2026-11-03",
      "data_label": "3 de novembro de 2026",
      "data_confirmada": true,
      "relevancia": "high",
      "relevancia_pt": "Alta relevância para o Brasil",
      "resultado": null,
      "content_slug": "guerra-comercial-eua-china-2026"
    }
  ]
}
```

---

### `GET /api/eleicoes/{id}`
**Middleware:** auth:sanctum + role  
**Params:** `id` (integer)  
**Resposta:**
```json
{
  "eleicao": {
    "id": 3,
    "nome_pais": "Estados Unidos",
    "codigo_pais": "US",
    "bandeira_emoji": "🇺🇸",
    "tipo_eleicao": "midterm",
    "tipo_label": "Meio de mandato",
    "data_eleicao": "2026-11-03",
    "data_label": "3 de novembro de 2026",
    "data_confirmada": true,
    "relevancia": "high",
    "relevancia_pt": "Alta relevância para o Brasil",
    "contexto": "As eleições de meio de mandato americanas de 2026 definirão o equilíbrio de poder no Congresso...",
    "relevancia_brasil": "O resultado pode reconfigurar a política comercial americana com impacto direto no agro brasileiro...",
    "candidatos": [
      { "nome": "Partido Democrata", "partido": "DNC", "posicao": "favorito" },
      { "nome": "Partido Republicano", "partido": "GOP", "posicao": "segundo" }
    ],
    "resultado": null
  },
  "conteudo_relacionado": {
    "id": 42,
    "titulo": "Guerra Comercial 2.0 — O que muda para o Brasil",
    "slug": "guerra-comercial-eua-china-2026",
    "tipo": "tese",
    "publicado_em": "2026-03-15T10:00:00Z"
  }
}
```

**Errors:**
```json
// 404
{ "mensagem": "Eleição não encontrada.", "codigo": "ELEICAO_NAO_ENCONTRADA" }
```

---

### `POST /api/admin/eleicoes`
**Middleware:** auth:sanctum + role admin  
**Body:**
```json
{
  "nome_pais": "Chile",
  "codigo_pais": "CL",
  "bandeira_emoji": "🇨🇱",
  "tipo_eleicao": "presidential",
  "data_eleicao": "2026-11-15",
  "data_label": "15 de novembro de 2026",
  "data_confirmada": true,
  "relevancia": "medium",
  "contexto": "Eleição presidencial chilena com dois turnos previstos...",
  "relevancia_brasil": "A orientação do novo governo chileno afeta acordos de mineração e litio...",
  "candidatos": "[{\"nome\": \"Candidato X\", \"partido\": \"Partido Y\", \"posicao\": \"favorito\"}]",
  "content_slug": null
}
```
**Resposta:** `201 Created`
```json
{ "eleicao": { "id": 16, "nome_pais": "Chile", "tipo_eleicao": "presidential", ... } }
```

---

### `PATCH /api/admin/eleicoes/{id}`
**Middleware:** auth:sanctum + role admin  
**Body (parcial — apenas campos a atualizar):**
```json
{
  "resultado": "Gabriel Boric reeleito com 54% dos votos no 2º turno."
}
```
**Resposta:** `200`
```json
{ "eleicao": { "id": 16, "resultado": "Gabriel Boric reeleito...", ... } }
```

---

### `DELETE /api/admin/eleicoes/{id}`
**Middleware:** auth:sanctum + role admin  
**Comportamento:** Soft delete — `publicado = false`, registro permanece no banco  
**Resposta:** `200`
```json
{ "sucesso": true }
```

---

## 7. Frontend React

### Componentes Principais

```
src/
├── components/
│   └── radar/
│       ├── CalendarioEleicoes.tsx     ← grade de 12 meses com scroll horizontal
│       ├── CardEleicao.tsx            ← card individual por eleição
│       ├── PainelEleicao.tsx          ← painel deslizante de detalhe (Framer Motion)
│       └── ListaCandidatos.tsx        ← candidatos com badge de posição
├── hooks/
│   ├── useEleicoes.ts                 ← React Query para lista de eleições
│   └── useEleicaoDetalhe.ts           ← React Query para detalhe lazy-loaded
├── pages/
│   └── RadarEleicoesPage.tsx          ← /eleicoes
└── services/
    └── eleicoesApi.ts
```

### Rota no React Router
```typescript
// src/router.tsx
<Route path="/eleicoes" element={<RadarEleicoesPage />} />
```

### `RadarEleicoesPage.tsx`
Estrutura da página:
1. **Header:** título "Radar de Eleições" + subtítulo + contagem total
2. **Filtro de relevância:** "Todas" | "Alta relevância" | "Média" | "Baixa"
3. **`CalendarioEleicoes`:** grade de 12 meses com scroll horizontal
4. **Legenda:** Alta (vermelho) / Média (amarelo) / Baixa (branco)
5. **`PainelEleicao`:** fixed right, abre ao clicar num card

### `CalendarioEleicoes.tsx`
Grade horizontal com **12 colunas mensais**, largura fixa de 220px cada.  
Container com `overflow-x: auto`.

```typescript
// Calcular próximos 12 meses
function calcularProximosMeses(quantidade: number): Mes[] {
  const meses: Mes[] = [];
  const agora = new Date();
  for (let i = 0; i < quantidade; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() + i, 1);
    meses.push({
      chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      eMesAtual: i === 0,
    });
  }
  return meses;
}

// Filtrar e ordenar eleições de um mês
function eleicoesDeMes(eleicoes: Eleicao[], chaveMes: string): Eleicao[] {
  return eleicoes
    .filter(e => {
      const d = new Date(e.data_eleicao);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return chave === chaveMes;
    })
    .sort((a, b) => {
      const ordem = { high: 0, medium: 1, low: 2 };
      return ordem[a.relevancia] - ordem[b.relevancia];
    });
}
```

**Visual de cada coluna:**
- Mês atual: `border-top: 2px solid #C9B882` + badge "agora"
- Outros meses: `border-top: 2px solid rgba(255,255,255,0.1)`
- Colunas vazias: texto `—` em `text-white/15`
- Eleições ordenadas por relevância dentro de cada mês

### `CardEleicao.tsx`

```typescript
const ESTILOS_RELEVANCIA = {
  high:   { borda: 'border-l-red-400',    texto: 'text-red-400' },
  medium: { borda: 'border-l-yellow-400', texto: 'text-yellow-400' },
  low:    { borda: 'border-l-white/20',   texto: 'text-white/30' },
};

const LABELS_TIPO: Record<string, string> = {
  presidential:  'Presidencial',
  parliamentary: 'Parlamentar',
  midterm:       'Meio de mandato',
  regional:      'Regional',
  referendum:    'Referendo',
};

// Card compacto:
// - Borda lateral esquerda colorida por relevância
// - Linha 1: bandeira_emoji + nome_pais (truncado se necessário)
// - Linha 2: tipo da eleição
// - Linha 3: (~)data_label — ~ se data_confirmada = false
// - Linha 4: resultado (em dourado) se preenchido
```

### `PainelEleicao.tsx`
Painel deslizante fixo na direita, w-[440px], animação com Framer Motion.

```typescript
// AnimatePresence + motion.div
// initial={{ x: "100%" }} → animate={{ x: 0 }} → exit={{ x: "100%" }}
// transition={{ type: "spring", damping: 30, stiffness: 300 }}

// Seções:
// 1. Header sticky: bandeira + tipo + país + data
// 2. Badge de relevância colorido
// 3. Contexto político (quando preenchido)
// 4. Candidatos principais (ListaCandidatos)
// 5. Por que importa para o Brasil (fundo dourado #C9B882/5)
// 6. Resultado (quando eleição já realizada)
// 7. Análise relacionada (link para Biblioteca)
```

### `ListaCandidatos.tsx`
```typescript
const ESTILOS_POSICAO: Record<string, string> = {
  favorito:   'text-[#c9b882] border-[#c9b882]/40',
  segundo:    'text-white/50 border-white/15',
  terceiro:   'text-white/30 border-white/10',
  indefinido: 'text-white/20 border-white/8',
};

// Cada candidato: nome + partido + badge de posição
```

### Filtro de relevância (client-side)
```typescript
// Localizado no header da página
// Ao selecionar relevância, React Query NÃO faz nova requisição
// Filtro aplicado com useMemo sobre os dados em cache

const eleicoesFiltradas = useMemo(() => {
  if (!data?.eleicoes) return [];
  if (filtroRelevancia === 'all') return data.eleicoes;
  return data.eleicoes.filter(e => e.relevancia === filtroRelevancia);
}, [data, filtroRelevancia]);
```

### Fluxo de dados com React Query

```typescript
function RadarEleicoesPage() {
  const [filtroRelevancia, setFiltroRelevancia] = useState<string>('all');
  const [eleicaoIdSelecionada, setEleicaoIdSelecionada] = useState<number | null>(null);

  // Lista completa — staleTime alto pois dados mudam raramente
  const { data: listData } = useQuery({
    queryKey: ['eleicoes', 'upcoming'],
    queryFn: () => eleicoesApi.listar({ view: 'upcoming' }),
    staleTime: 60 * 60 * 1000, // 1 hora
  });

  // Filtro client-side (sem nova requisição)
  const eleicoesFiltradas = useMemo(() => {
    if (!listData?.eleicoes) return [];
    if (filtroRelevancia === 'all') return listData.eleicoes;
    return listData.eleicoes.filter(e => e.relevancia === filtroRelevancia);
  }, [listData, filtroRelevancia]);

  // Detalhe — lazy: enabled apenas quando painel abre
  const { data: detalheData } = useQuery({
    queryKey: ['eleicao', eleicaoIdSelecionada],
    queryFn: () => eleicoesApi.buscarDetalhe(eleicaoIdSelecionada!),
    enabled: !!eleicaoIdSelecionada,
    staleTime: 30 * 60 * 1000,
  });

  return (
    <>
      {/* Header + filtros + calendário + legenda */}
      <PainelEleicao
        eleicao={detalheData?.eleicao ?? null}
        conteudoRelacionado={detalheData?.conteudo_relacionado ?? null}
        onClose={() => setEleicaoIdSelecionada(null)}
      />
    </>
  );
}
```

### Painel Admin (Frontend)

O painel admin de eleições é implementado dentro do painel admin existente do M3.  
Adicionar nova seção "Eleições" com:
- Listagem de todas as eleições (incluindo despublicadas), ordenadas por data
- Formulário de criação com todos os campos abaixo
- Edição inline (incluindo campo "resultado" após a eleição)
- Botão "Despublicar" com soft delete

```typescript
// Campos do formulário de cadastro:
const CAMPOS_FORMULARIO = [
  { nome: 'nome_pais',          label: 'País',                         tipo: 'text',     obrigatorio: true  },
  { nome: 'codigo_pais',        label: 'Código ISO (2 chars)',          tipo: 'text',     obrigatorio: false },
  { nome: 'bandeira_emoji',     label: 'Emoji da bandeira',            tipo: 'text',     obrigatorio: false },
  { nome: 'tipo_eleicao',       label: 'Tipo',                         tipo: 'select',   obrigatorio: true,
    opcoes: ['presidential', 'parliamentary', 'midterm', 'regional', 'referendum'] },
  { nome: 'data_eleicao',       label: 'Data',                         tipo: 'date',     obrigatorio: true  },
  { nome: 'data_label',         label: 'Data por extenso',             tipo: 'text',     obrigatorio: true  },
  { nome: 'data_confirmada',    label: 'Data confirmada?',             tipo: 'toggle',   padrao: true       },
  { nome: 'relevancia',         label: 'Relevância',                   tipo: 'select',   obrigatorio: true,
    opcoes: ['high', 'medium', 'low'] },
  { nome: 'contexto',           label: 'Contexto político',            tipo: 'textarea', obrigatorio: false },
  { nome: 'relevancia_brasil',  label: 'Por que importa para o Brasil',tipo: 'textarea', obrigatorio: false },
  { nome: 'candidatos',         label: 'Candidatos (JSON)',            tipo: 'textarea', obrigatorio: false,
    placeholder: '[{"nome": "X", "partido": "Y", "posicao": "favorito"}]' },
  { nome: 'content_slug',       label: 'Slug do conteúdo relacionado', tipo: 'text',     obrigatorio: false },
  { nome: 'resultado',          label: 'Resultado (pós-eleição)',       tipo: 'textarea', obrigatorio: false },
];
```

---

## 8. Agendamentos (Laravel Scheduler)

**Este módulo não possui agendamentos.** Os dados são inseridos e mantidos manualmente pelo administrador. Não há coleta automática, geração de IA ou atualização periódica.

---

## 9. Jobs / Queues

**Este módulo não utiliza Jobs ou Filas.** Todas as operações são síncronas (CRUD simples). O volume de dados é pequeno — dezenas de eleições por ano, administradas manualmente.

---

## 10. Controle de Acesso

| Role | Ver calendário | Ver detalhe | Criar eleição | Editar eleição | Excluir (soft) |
|---|---|---|---|---|---|
| `assinante_essencial` | Sim | Sim | Não | Não | Não |
| `assinante_pro` | Sim | Sim | Não | Não | Não |
| `assinante_reservado` | Sim | Sim | Não | Não | Não |
| `admin` | Sim | Sim | **Sim** | **Sim** | **Sim** |

**Todos os assinantes têm acesso completo à leitura.** Controle de escrita exclusivo para `admin`.

**Dupla verificação para segurança em profundidade:**
1. Middleware `role:admin` nas rotas de escrita
2. `authorize()` do FormRequest verifica `$this->user()->hasRole('admin')`

---

## 11. Error Handling

| Situação | HTTP | Código interno | Mensagem |
|---|---|---|---|
| Não autenticado | 401 | `NAO_AUTENTICADO` | "Autenticação necessária." |
| Sem permissão de role | 403 | `SEM_PERMISSAO` | "Seu plano não permite acesso a este recurso." |
| Admin sem role admin | 403 | `ACESSO_NEGADO` | "Acesso negado. Operação requer perfil admin." |
| Eleição não encontrada | 404 | `ELEICAO_NAO_ENCONTRADA` | "Eleição não encontrada." |
| Validação falhou (criar) | 422 | `VALIDACAO_FALHOU` | Objeto `erros` com campos inválidos |
| `tipo_eleicao` inválido | 422 | `TIPO_INVALIDO` | "Tipo de eleição inválido. Use: presidential, parliamentary, midterm, regional, referendum." |
| `relevancia` inválida | 422 | `RELEVANCIA_INVALIDA` | "Relevância inválida. Use: high, medium, low." |
| `candidatos` não é JSON | 422 | `JSON_INVALIDO` | "O campo candidatos deve ser um JSON válido." |
| `data_eleicao` inválida | 422 | `DATA_INVALIDA` | "Data inválida. Use o formato YYYY-MM-DD." |

**Cache de eleições no Redis:**
```php
// EleicaoController::index() — cachear por 1h
$cacheKey = "eleicoes_upcoming"; // ou "eleicoes_past"
$eleicoes = Cache::remember($cacheKey, 3600, function () use ($filtros) {
    return $this->eleicaoService->listar($filtros);
});

// EleicaoAdminController — invalidar cache após qualquer escrita
Cache::forget('eleicoes_upcoming');
Cache::forget('eleicoes_past');
```

**Formato padrão de todos os erros da API:**
```json
{
  "mensagem": "Descrição legível do erro.",
  "codigo": "CODIGO_INTERNO_EM_MAIUSCULAS",
  "erros": {
    "campo": ["Mensagem específica do campo."]
  }
}
```

---

## 12. Checklist de Entrega

### Banco de dados
- [ ] Migration `eleicoes` executada com todos os campos e tipos corretos
- [ ] `timestamps()` configurado (Eloquent gerencia `created_at` e `updated_at` automaticamente)
- [ ] `EleicoesIniciaisSeeder` executado — 15 eleições iniciais cadastradas
- [ ] Índices `data_eleicao`, `relevancia` e `(publicado, data_eleicao)` criados
- [ ] Seeder testado: `php artisan db:seed --class=EleicoesIniciaisSeeder`

### API de leitura (assinantes)
- [ ] `GET /api/eleicoes` com `view=upcoming` retornando apenas eleições com `data_eleicao >= hoje`
- [ ] `GET /api/eleicoes` com `view=past` retornando últimas 20 realizadas em ordem decrescente
- [ ] `GET /api/eleicoes` com filtro de `relevancia` funcionando
- [ ] `GET /api/eleicoes` com filtro de `mes` (ex: `2026-09`) funcionando
- [ ] `GET /api/eleicoes/{id}` retornando detalhe + `conteudo_relacionado` da Biblioteca
- [ ] Accessors `tipo_label` e `relevancia_pt` incluídos na resposta JSON
- [ ] Cache Redis de 1h configurado e funcionando
- [ ] Somente eleições com `publicado = true` retornadas nas rotas públicas

### API de escrita (admin)
- [ ] `POST /api/admin/eleicoes` criando eleição com validação via `CriarEleicaoRequest`
- [ ] `PATCH /api/admin/eleicoes/{id}` com atualização parcial (PATCH semântico correto)
- [ ] `PATCH` para preencher `resultado` após eleição funcionando
- [ ] `DELETE /api/admin/eleicoes/{id}` executando soft delete (`publicado = false`)
- [ ] `GET /api/admin/eleicoes` listando todas (incluindo `publicado = false`) para painel admin
- [ ] Middleware `role:admin` protegendo todas as rotas de escrita
- [ ] Invalidação de cache Redis após cada operação de escrita

### Frontend — Calendário
- [ ] `CalendarioEleicoes` renderizando 12 meses com scroll horizontal
- [ ] Mês atual com `border-top` dourado e badge "agora"
- [ ] `CardEleicao` exibindo país, tipo, data e resultado quando disponível
- [ ] Borda lateral esquerda colorida por relevância nos cards
- [ ] `~` antes da data quando `data_confirmada = false`
- [ ] Colunas sem eleições exibindo `—`
- [ ] Eleições ordenadas por relevância dentro de cada mês (alta primeiro)
- [ ] Filtro de relevância no header com filtragem client-side (sem re-fetch)

### Frontend — Painel de detalhe
- [ ] `PainelEleicao` abrindo com animação Framer Motion ao clicar num card
- [ ] Lazy load: query só executa quando `eleicaoIdSelecionada !== null`
- [ ] Header sticky com bandeira, tipo, nome do país e data
- [ ] Badge de relevância colorido com label em português
- [ ] Contexto político exibido quando preenchido
- [ ] `ListaCandidatos` com badges de posição coloridos por ranking
- [ ] Seção "Por que importa para o Brasil" com fundo dourado destacado
- [ ] Campo resultado exibido quando a eleição foi realizada
- [ ] Link para conteúdo da Biblioteca quando `content_slug` preenchido
- [ ] Painel fechando ao clicar no `×`

### Painel Admin
- [ ] Seção "Eleições" adicionada ao painel `/admin` existente do M3
- [ ] Formulário de nova eleição com todos os campos e validação client-side
- [ ] Listagem de eleições cadastradas (incluindo despublicadas) em `/admin/eleicoes`
- [ ] Campo "resultado" editável somente no modo edição
- [ ] Botão "Despublicar" com soft delete e confirmação

### Integração e navegação
- [ ] "Eleições" adicionado à navegação do dashboard
- [ ] Rota `/eleicoes` configurada no React Router
- [ ] Grade auto-posicionada no mês atual ao carregar (scroll inicial)
- [ ] Página visível para todos os planos (essencial, pro, reservado, admin)

---

## Visão da Navegação Completa com Módulos 5–8

Com todos os 8 módulos implementados, a navegação do dashboard fica:

```typescript
const navItems = [
  { href: '/dashboard',       label: 'Feed de Tensões' },    // M1
  { href: '/mapa',            label: 'Mapa de Calor' },      // M2
  { href: '/biblioteca',      label: 'Biblioteca' },         // M3
  { href: '/linha-do-tempo',  label: 'Linha do Tempo' },     // M7
  { href: '/eleicoes',        label: 'Eleições' },           // M8
  { href: '/paises',          label: 'Meus Países' },        // M6
  // M4 (Indicadores) → barra horizontal permanente no topo da página
  // M5 (Alertas)     → badge pulsante no canto direito da navbar
];
```
