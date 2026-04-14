# PRD — Módulo 6: Perfil de País
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica  
**Versão:** 1.0  
**Data:** Abril 2026  
**Público:** Desenvolvedor Laravel Sênior implementando do zero

---

## 1. Visão Geral

O Módulo 6 é o **Perfil de País** — uma página dedicada para cada país que o assinante escolhe acompanhar. O assinante seleciona quais países quer monitorar e tem acesso a um painel completo com cinco dimensões:

1. Contexto geopolítico histórico (gerado pela IA semanalmente)
2. Liderança atual (gerado pela IA semanalmente)
3. Tensões ativas (eventos recentes do M1 em tempo real)
4. Indicadores econômicos-chave (dados do M4, atualizados a cada 15 min)
5. Eventos recentes do feed (tabela `eventos`, últimos 7 dias)

Os módulos anteriores mostram o mundo em movimento — eventos, regiões, tensões. O Módulo 6 mostra **o país em profundidade** — quem governa, o que quer, onde está frágil. Para o assinante de agro, energia ou importação, ter o perfil dos países relevantes é uma ferramenta diária.

### Duas formas de acesso
- **Via Mapa de Calor (M2):** clique em qualquer país abre o Perfil (em vez do painel lateral de eventos)
- **Via "Meus Países":** seção na navegação do dashboard onde o assinante gerencia e acessa seus perfis

### Regra de atualização dos dados
| Seção | Fonte | Atualização |
|---|---|---|
| Contexto geopolítico | Claude API | Semanal (toda segunda, madrugada) |
| Liderança atual | Claude API | Semanal (toda segunda, madrugada) |
| Tensões ativas | Tabela `eventos` (M1) | Automático ao carregar |
| Indicadores econômicos | Tabela `indicadores` (M4) | A cada 15 min |
| Eventos recentes | Tabela `eventos` (M1) | Automático ao carregar |

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| **Backend framework** | Laravel 13 |
| **Banco de dados** | MySQL 8.x |
| **Cache** | Redis (perfis gerados em cache por 7 dias) |
| **Autenticação** | Laravel Sanctum |
| **Autorização** | Spatie Laravel Permission |
| **IA** | Claude API (Anthropic SDK PHP) |
| **Fila de Jobs** | Laravel Queue (driver: redis) |
| **Agendamento** | Laravel Scheduler |
| **Frontend** | React SPA (Vite + React + TypeScript + TailwindCSS) |
| **Estado/Fetch** | React Query (TanStack Query v5) |
| **Roteamento SPA** | React Router v7 |

---

## 3. Dependências de Outros Módulos

| Módulo | O que usa |
|---|---|
| **Módulo 1** | Tabela `eventos` — eventos recentes por país (campo `regiao` e `titulo`) |
| **Módulo 2** | Mapa interativo — clique no país redireciona para o Perfil |
| **Módulo 3** | Tabela `conteudos` — briefings que mencionaram o país (via `content_slug`) |
| **Módulo 4** | Tabela `indicadores` — indicadores de risco relevantes para cada país |

**Pré-requisitos:**
- Módulos 1, 2, 3 e 4 em produção
- Sistema de autenticação funcionando (tabela `users`)

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|---|---|
| **Prazo MVP** | 4 dias de desenvolvimento |
| **Custo de implementação** | R$ 8.000 – R$ 18.000 |
| **Custo mensal adicional** | R$ 50–150 (Claude API para geração semanal de perfis) |
| **Volume de chamadas IA** | ~4 chamadas/país/semana × 20 países = ~80 chamadas/semana |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Console/
│   └── Commands/
│       └── GerarPerfisPaises.php          ← gera perfis via IA (roda às segundas)
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── PaisController.php          ← lista países, perfil completo, eventos
│   │       └── PaisUsuarioController.php   ← gerenciar países seguidos pelo assinante
│   ├── Requests/
│   │   └── AdicionarPaisRequest.php
├── Jobs/
│   └── GerarPerfilPaisJob.php             ← geração async por país
├── Models/
│   ├── PerfilPais.php
│   └── PaisUsuario.php
├── Services/
│   ├── GeradorPerfilPaisService.php       ← orquestra geração via Claude API
│   └── EventosPaisService.php             ← busca eventos recentes por país
database/
├── migrations/
│   ├── xxxx_create_perfis_paises_table.php
│   └── xxxx_create_paises_usuarios_table.php
└── seeders/
    └── PaisesInicialSeeder.php            ← insere os 20 países iniciais
routes/
└── api.php
```

### 5.2 Models e Migrations (Schema Completo)

#### Migration: `perfis_paises`

```php
Schema::create('perfis_paises', function (Blueprint $table) {
    $table->id();
    $table->string('codigo_pais', 2)->unique();    // ISO 3166-1 alpha-2 (ex: "US", "CN")
    $table->string('nome_pais');                   // nome em inglês
    $table->string('nome_pais_pt');                // nome em português
    $table->string('bandeira_emoji', 10)->nullable();  // ex: "🇺🇸"
    $table->string('regiao_geopolitica')->nullable();  // ex: "América do Norte"

    // Conteúdo gerado pela IA
    $table->longText('contexto_geopolitico')->nullable(); // 200–300 palavras
    $table->text('analise_lideranca')->nullable();        // 100–150 palavras

    // Configuração estática por país
    $table->json('indicadores_relevantes')->nullable();   // ex: ["BRLUSD","BZ=F"]
    $table->json('termos_busca')->nullable();             // ex: ["EUA","Estados Unidos","Washington"]

    $table->timestamp('gerado_em')->nullable();           // última geração pela IA
    $table->timestamps();

    $table->index('codigo_pais');
    $table->index('nome_pais_pt');
});
```

**Model `PerfilPais`:**
```php
// app/Models/PerfilPais.php
protected $table = 'perfis_paises';
protected $fillable = [
    'codigo_pais', 'nome_pais', 'nome_pais_pt', 'bandeira_emoji',
    'regiao_geopolitica', 'contexto_geopolitico', 'analise_lideranca',
    'indicadores_relevantes', 'termos_busca', 'gerado_em',
];
protected $casts = [
    'indicadores_relevantes' => 'array',
    'termos_busca'           => 'array',
    'gerado_em'              => 'datetime',
];

public function usuariosQueAcompanham(): HasMany
{
    return $this->hasMany(PaisUsuario::class, 'codigo_pais', 'codigo_pais');
}

public function precisaAtualizacao(): bool
{
    return is_null($this->gerado_em)
        || $this->gerado_em->lt(now()->subDays(7));
}
```

---

#### Migration: `paises_usuarios`

```php
Schema::create('paises_usuarios', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('user_id');
    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
    $table->string('codigo_pais', 2);
    $table->foreign('codigo_pais')->references('codigo_pais')->on('perfis_paises')->cascadeOnDelete();
    $table->timestamp('adicionado_em')->useCurrent();
    $table->timestamps();

    $table->unique(['user_id', 'codigo_pais']);
    $table->index('user_id');
    $table->index('codigo_pais');
});
```

**Model `PaisUsuario`:**
```php
// app/Models/PaisUsuario.php
protected $table = 'paises_usuarios';
protected $fillable = ['user_id', 'codigo_pais', 'adicionado_em'];
protected $casts = ['adicionado_em' => 'datetime'];

public function usuario(): BelongsTo
{
    return $this->belongsTo(User::class);
}

public function perfil(): BelongsTo
{
    return $this->belongsTo(PerfilPais::class, 'codigo_pais', 'codigo_pais');
}
```

---

#### Seeder: `PaisesInicialSeeder`

Inserir os 20 países mais relevantes para o Brasil ao configurar o banco. Os perfis textuais são gerados pelo scheduler na primeira execução.

```php
// Amostra do array de países para o seeder
$paises = [
    [
        'codigo_pais'         => 'US',
        'nome_pais'           => 'United States',
        'nome_pais_pt'        => 'Estados Unidos',
        'bandeira_emoji'      => '🇺🇸',
        'regiao_geopolitica'  => 'América do Norte',
        'indicadores_relevantes' => ['BRLUSD', 'ZS=F', 'ZW=F'],
        'termos_busca'        => ['EUA', 'Estados Unidos', 'Washington', 'Biden', 'Trump'],
    ],
    [
        'codigo_pais'         => 'CN',
        'nome_pais'           => 'China',
        'nome_pais_pt'        => 'China',
        'bandeira_emoji'      => '🇨🇳',
        'regiao_geopolitica'  => 'Ásia-Pacífico',
        'indicadores_relevantes' => ['TIO=F', 'ZS=F'],
        'termos_busca'        => ['China', 'Pequim', 'Xi Jinping', 'Pequim'],
    ],
    [
        'codigo_pais'         => 'RU',
        'nome_pais'           => 'Russia',
        'nome_pais_pt'        => 'Rússia',
        'bandeira_emoji'      => '🇷🇺',
        'regiao_geopolitica'  => 'Eurásia',
        'indicadores_relevantes' => ['BZ=F', 'NG=F', 'ZW=F'],
        'termos_busca'        => ['Rússia', 'Moscou', 'Putin', 'Kremlin'],
    ],
    // ... demais 17 países: AR, EU, DE, GB, JP, IN, SA, IR, IL, UA, TR, VE, PY, IQ, NG, CA, AU
];
```

**Lista completa de países no seeder:**

| País | Código | Indicadores relevantes | Termos de busca |
|---|---|---|---|
| Estados Unidos | US | BRLUSD, ZS=F, ZW=F | EUA, Estados Unidos, Washington |
| China | CN | TIO=F, ZS=F | China, Pequim, Xi Jinping |
| Rússia | RU | BZ=F, NG=F, ZW=F | Rússia, Moscou, Putin, Kremlin |
| Argentina | AR | BRLUSD | Argentina, Buenos Aires, Milei |
| União Europeia | EU | NG=F, BZ=F | Europa, UE, Bruxelas, BCE |
| Alemanha | DE | NG=F | Alemanha, Berlim, Scholz |
| Reino Unido | GB | BRLUSD | Reino Unido, Londres, Starmer |
| Japão | JP | TIO=F | Japão, Tóquio, Kishida |
| Índia | IN | BZ=F, ZW=F | Índia, Nova Delhi, Modi |
| Arábia Saudita | SA | BZ=F | Arábia Saudita, Riade, MBS, OPEP |
| Irã | IR | BZ=F, NG=F | Irã, Teerã, Khamenei, IRGC |
| Israel | IL | BZ=F | Israel, Tel Aviv, Netanyahu |
| Ucrânia | UA | ZW=F, NG=F | Ucrânia, Kiev, Zelensky |
| Turquia | TR | NG=F | Turquia, Ancara, Erdogan |
| Venezuela | VE | BZ=F | Venezuela, Caracas, Maduro |
| Paraguai | PY | BRLUSD | Paraguai, Assunção |
| Iraque | IQ | BZ=F | Iraque, Bagdá, petróleo |
| Nigéria | NG | BZ=F | Nigéria, Abuja, Lagos |
| Canadá | CA | ZW=F, ZS=F | Canadá, Ottawa, Trudeau |
| Austrália | AU | TIO=F | Austrália, Canberra, Albanese |

---

### 5.3 Services

#### `GeradorPerfilPaisService`
**Responsabilidades:**
- Buscar países com `gerado_em` nulo ou com mais de 7 dias (máx 5 por execução)
- Para cada país, chamar Claude API duas vezes: contexto geopolítico + análise de liderança
- Salvar resultados em `perfis_paises` e atualizar `gerado_em`
- Aplicar pausa de 2s entre países para respeitar rate limit

**Prompts da Claude API:**

*Contexto geopolítico (200–300 palavras):*
```
Você é um analista geopolítico sênior.
Escreva o contexto geopolítico de {nome_pais_pt} em 200-300 palavras.
Cubra obrigatoriamente:
1. Posição estratégica no tabuleiro global atual
2. Principais dependências e vulnerabilidades estruturais
3. Alianças centrais e rivalidades históricas relevantes
4. Por que este país importa para o Brasil
Estilo: direto, denso, sem eufemismos. Comece pela afirmação mais importante.
```

*Análise de liderança (100–150 palavras):*
```
Você é um analista geopolítico sênior.
Escreva uma análise da liderança atual de {nome_pais_pt} em 100-150 palavras.
Cubra:
1. Quem está no poder (nome, cargo, desde quando)
2. Orientação geopolítica (alinhamento, doutrina)
3. Prioridades declaradas e agenda real
4. Como esta liderança afeta o comportamento internacional do país
```

**Métodos principais:**
```php
public function executar(): int                        // retorna países processados
private function gerarContextoGeopolitico(PerfilPais $pais): string
private function gerarAnaliseLideranca(PerfilPais $pais): string
private function chamarClaudeApi(string $prompt, int $maxTokens): string
```

#### `EventosPaisService`
**Responsabilidades:**
- Buscar os últimos 10 eventos da tabela `eventos` (M1) que mencionam o país
- Usar os `termos_busca` do país para filtrar via `OR` no `regiao` e `titulo`
- Ordenar por `pontuacao_impacto` decrescente
- Limitar ao últimos 7 dias
- Retornar array formatado para a API

**Métodos principais:**
```php
public function buscarEventosRecentes(PerfilPais $pais, int $diasAtras = 7): Collection
private function construirFiltroOr(array $termosBusca): string
```

---

### 5.4 FormRequests

```php
// app/Http/Requests/AdicionarPaisRequest.php
public function authorize(): bool
{
    return auth()->check();
}

public function rules(): array
{
    return [
        'codigo_pais' => [
            'required',
            'string',
            'size:2',
            'exists:perfis_paises,codigo_pais',
        ],
    ];
}

public function messages(): array
{
    return [
        'codigo_pais.exists' => 'País não encontrado no sistema.',
        'codigo_pais.size'   => 'Código do país deve ter 2 caracteres (ISO 3166-1).',
    ];
}
```

---

### 5.5 Controllers e Rotas

**`PaisController`:**
```php
// Lista todos os países disponíveis (com busca por nome)
public function index(Request $request): JsonResponse

// Retorna perfil completo + indicadores do país
public function show(string $codigoPais): JsonResponse

// Retorna eventos recentes do país
public function eventos(string $codigoPais): JsonResponse
```

**`PaisUsuarioController`:**
```php
// GET — lista países que o usuário acompanha
public function index(): JsonResponse

// POST — adicionar país (usa AdicionarPaisRequest)
public function store(AdicionarPaisRequest $request): JsonResponse

// DELETE — remover país
public function destroy(string $codigoPais): JsonResponse
```

**`routes/api.php`:**
```php
// Rotas públicas de países (qualquer assinante autenticado)
Route::middleware(['auth:sanctum', 'role:assinante_essencial|assinante_pro|assinante_reservado|admin'])
    ->group(function () {

        // Catálogo de países
        Route::get('/paises',                   [PaisController::class, 'index']);
        Route::get('/paises/{codigo}',          [PaisController::class, 'show']);
        Route::get('/paises/{codigo}/eventos',  [PaisController::class, 'eventos']);

        // Países do usuário
        Route::get('/meus-paises',              [PaisUsuarioController::class, 'index']);
        Route::post('/meus-paises',             [PaisUsuarioController::class, 'store']);
        Route::delete('/meus-paises/{codigo}',  [PaisUsuarioController::class, 'destroy']);
    });

// Rota interna do scheduler
Route::middleware('cron.secret')
    ->post('/interno/gerar-perfis-paises', [CronPaisController::class, 'gerarPerfis']);
```

---

## 6. Endpoints da API

### `GET /api/paises?q={termo}`
**Middleware:** auth:sanctum + role  
**Params:** `q` (string, opcional) — busca por nome em português  
**Resposta:**
```json
{
  "paises": [
    {
      "codigo_pais": "US",
      "nome_pais_pt": "Estados Unidos",
      "bandeira_emoji": "🇺🇸",
      "regiao_geopolitica": "América do Norte"
    },
    {
      "codigo_pais": "CN",
      "nome_pais_pt": "China",
      "bandeira_emoji": "🇨🇳",
      "regiao_geopolitica": "Ásia-Pacífico"
    }
  ]
}
```

---

### `GET /api/paises/{codigo}`
**Middleware:** auth:sanctum + role  
**Params:** `codigo` (string, 2 chars) — ex: `US`, `CN`  
**Resposta:**
```json
{
  "perfil": {
    "id": 1,
    "codigo_pais": "US",
    "nome_pais_pt": "Estados Unidos",
    "bandeira_emoji": "🇺🇸",
    "regiao_geopolitica": "América do Norte",
    "contexto_geopolitico": "Os Estados Unidos permanecem a potência hegemônica...",
    "analise_lideranca": "Donald Trump, presidente desde janeiro de 2025...",
    "gerado_em": "2026-04-14T03:00:00Z"
  },
  "indicadores": [
    {
      "simbolo": "BRLUSD",
      "nome": "Real / Dólar",
      "valor": 5.14,
      "variacao_pct": -0.32,
      "moeda": "BRL"
    }
  ]
}
```

---

### `GET /api/paises/{codigo}/eventos`
**Middleware:** auth:sanctum + role  
**Params:** `codigo` (string)  
**Resposta:**
```json
{
  "eventos": [
    {
      "id": 42,
      "titulo": "EUA ampliam tarifas sobre produtos chineses em 25%",
      "analise_ia": "A escalada tarifária...",
      "fonte": "Reuters",
      "pontuacao_impacto": 9,
      "label_impacto": "Crítico",
      "publicado_em": "2026-04-13T14:00:00Z",
      "url_fonte": "https://reuters.com/..."
    }
  ]
}
```

---

### `GET /api/meus-paises`
**Middleware:** auth:sanctum + role  
**Resposta:**
```json
{
  "paises": [
    {
      "codigo_pais": "US",
      "adicionado_em": "2026-03-01T10:00:00Z",
      "perfil": {
        "nome_pais_pt": "Estados Unidos",
        "bandeira_emoji": "🇺🇸",
        "regiao_geopolitica": "América do Norte"
      }
    }
  ]
}
```

---

### `POST /api/meus-paises`
**Middleware:** auth:sanctum + role  
**Body:**
```json
{ "codigo_pais": "CN" }
```
**Resposta:** `201 Created`
```json
{ "sucesso": true, "codigo_pais": "CN" }
```
**Errors:**
```json
// 409 — já adicionado
{ "mensagem": "País já está na sua lista.", "codigo": "PAIS_JA_ADICIONADO" }
// 422 — país não existe
{ "mensagem": "País não encontrado no sistema.", "codigo": "PAIS_NAO_ENCONTRADO" }
```

---

### `DELETE /api/meus-paises/{codigo}`
**Middleware:** auth:sanctum + role  
**Params:** `codigo` (string)  
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
│   ├── BuscaPais.tsx               ← input com autocomplete (debounce 300ms)
│   ├── CardPais.tsx                ← card na lista "Meus Países"
│   ├── PerfilPais.tsx              ← perfil completo (5 seções)
│   ├── IndicadoresPais.tsx         ← indicadores econômicos do país
│   └── EventosRecentesPais.tsx     ← lista de eventos dos últimos 7 dias
├── hooks/
│   ├── useMeusPaises.ts            ← React Query para países do usuário
│   ├── usePerfilPais.ts            ← React Query para perfil de um país
│   └── useEventosPais.ts           ← React Query para eventos do país
├── pages/
│   ├── MeusPaisesPage.tsx          ← /paises (lista + busca)
│   └── PerfilPaisPage.tsx          ← /paises/:codigo (perfil completo)
└── services/
    └── paisesApi.ts
```

### Páginas e Rotas do React Router

```typescript
// src/router.tsx
<Route path="/paises" element={<MeusPaisesPage />} />
<Route path="/paises/:codigo" element={<PerfilPaisPage />} />
```

### `MeusPaisesPage.tsx`
- Exibe lista dos países seguidos pelo usuário autenticado
- `BuscaPais` com debounce 300ms para adicionar novos países
- Estado vazio com instrução quando lista está vazia
- Cada `CardPais` tem botão de remover

### `PerfilPaisPage.tsx`
Página com 5 seções verticais:
1. **Header:** bandeira, nome, região, botão "Acompanhar / Acompanhando"
2. **Contexto geopolítico:** texto gerado pela IA
3. **Liderança atual:** texto gerado pela IA
4. **Indicadores econômicos:** via `IndicadoresPais`, dados do M4
5. **Eventos recentes:** via `EventosRecentesPais`, últimos 7 dias

### Fluxo de dados com React Query

```typescript
// Página de perfil — três queries paralelas
function PerfilPaisPage() {
  const { codigo } = useParams();
  
  // Query 1: perfil + indicadores
  const { data: perfilData } = useQuery({
    queryKey: ['pais', codigo],
    queryFn: () => paisesApi.buscarPerfil(codigo!),
    staleTime: 30 * 60 * 1000, // 30 min (conteúdo semanal)
  });
  
  // Query 2: eventos recentes (mais dinâmico)
  const { data: eventosData } = useQuery({
    queryKey: ['pais-eventos', codigo],
    queryFn: () => paisesApi.buscarEventos(codigo!),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  
  // Query 3: verificar se está seguindo
  const { data: meusPaises } = useQuery({
    queryKey: ['meus-paises'],
    queryFn: paisesApi.listarMeusPaises,
  });
  
  const estaSeguindo = meusPaises?.paises?.some(
    (p: any) => p.codigo_pais === codigo
  );
  
  // Mutation: toggle follow
  const queryClient = useQueryClient();
  const toggleSeguir = useMutation({
    mutationFn: estaSeguindo
      ? () => paisesApi.removerPais(codigo!)
      : () => paisesApi.adicionarPais(codigo!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meus-paises'] }),
  });
}
```

### `BuscaPais.tsx`
```typescript
// Debounce 300ms, busca via GET /api/paises?q=
// Ao selecionar → POST /api/meus-paises → invalidate ['meus-paises']
// Mostra bandeira, nome em pt e região nos resultados
```

### Integração com o Módulo 2 (Mapa de Calor)
```typescript
// No componente WorldMap do M2, substituir handler de clique:
// Antes: abre RegionPanel com eventos
// Depois: navega para /paises/{codigo}

// Se o país tem perfil cadastrado → redireciona para /paises/{codigo}
// Se não tem perfil → mantém o RegionPanel como fallback (países fora dos 20 iniciais)

import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

function handleCliquePais(codigoPais: string | null) {
  if (codigoPais) {
    navigate(`/paises/${codigoPais}`);
  } else {
    // fallback para RegionPanel
    abrirRegionPanel(geoNome);
  }
}
```

---

## 8. Agendamentos (Laravel Scheduler)

```php
// Gerar perfis toda segunda-feira de madrugada (entre 2h e 4h)
Schedule::command('paises:gerar-perfis')
    ->weeklyOn(Schedule::MONDAY, '03:00')
    ->withoutOverlapping()
    ->onFailure(fn() => Log::error('Falha ao gerar perfis de países'));
```

**Command:**
```bash
php artisan paises:gerar-perfis
```

O command processa 5 países por execução (controle de custo). Países com `gerado_em` nulo têm prioridade. Países já gerados há menos de 7 dias são ignorados. Se houver mais de 5 países pendentes, serão processados nas próximas execuções (scheduler roda toda segunda).

---

## 9. Jobs / Queues

### `GerarPerfilPaisJob`
```php
// Geração async de um país individualmente (quando admin cadastra novo país)
// Queue: 'ia'
// Tries: 3
// Timeout: 60 segundos
// Backoff: [30, 60] segundos
```

**Configuração:**
```env
QUEUE_CONNECTION=redis
```

**Worker:**
```bash
php artisan queue:work redis --queue=ia,default --tries=3
```

---

## 10. Controle de Acesso

| Role | Pode ver lista de países | Pode acompanhar países | Pode ver perfil | Pode ver indicadores |
|---|---|---|---|---|
| `assinante_essencial` | Sim | Sim (até 3 países) | Sim | Apenas 1 indicador por país |
| `assinante_pro` | Sim | Sim (até 10 países) | Sim | Todos |
| `assinante_reservado` | Sim | Sim (ilimitado) | Sim | Todos |
| `admin` | Sim | Sim (ilimitado) | Sim | Todos |

**Limite de países por plano (no `PaisUsuarioController::store`):**
```php
private function verificarLimitePais(User $user): void
{
    $limites = [
        'assinante_essencial' => 3,
        'assinante_pro'       => 10,
    ];

    $role = $user->roles->first()?->name;
    if (isset($limites[$role])) {
        $contagem = PaisUsuario::where('user_id', $user->id)->count();
        if ($contagem >= $limites[$role]) {
            throw new LimitePaisesAtingidoException(
                "Seu plano permite acompanhar até {$limites[$role]} países."
            );
        }
    }
}
```

---

## 11. Error Handling

| Situação | HTTP | Código interno | Mensagem |
|---|---|---|---|
| Não autenticado | 401 | `NAO_AUTENTICADO` | "Autenticação necessária." |
| Sem permissão | 403 | `SEM_PERMISSAO` | "Seu plano não permite acesso a este recurso." |
| País não encontrado | 404 | `PAIS_NAO_ENCONTRADO` | "País não encontrado." |
| País já adicionado | 409 | `PAIS_JA_ADICIONADO` | "País já está na sua lista." |
| Limite de países atingido | 422 | `LIMITE_PAISES_ATINGIDO` | "Seu plano permite acompanhar até X países. Faça upgrade para continuar." |
| Falha na Claude API | 500 | `FALHA_IA` | "Erro ao gerar perfil. Tente novamente mais tarde." |
| País sem perfil gerado | 200 | — | Retorna `contexto_geopolitico: null` — frontend exibe "Perfil sendo preparado" |

**Cache de perfis:**
```php
// No PaisController::show() — cachear perfil por 30 minutos no Redis
$perfil = Cache::remember("perfil_pais_{$codigoPais}", 1800, function () use ($codigoPais) {
    return PerfilPais::where('codigo_pais', $codigoPais)->firstOrFail();
});

// Invalidar cache quando o scheduler regenera o perfil
Cache::forget("perfil_pais_{$codigoPais}");
```

---

## 12. Checklist de Entrega

### Banco de dados
- [ ] Migration `perfis_paises` executada com todos os campos
- [ ] Migration `paises_usuarios` executada com constraint `UNIQUE(user_id, codigo_pais)`
- [ ] `PaisesInicialSeeder` executado com os 20 países e seus `termos_busca` e `indicadores_relevantes`
- [ ] Índices criados corretamente

### Geração de perfis
- [ ] `GeradorPerfilPaisService` gerando `contexto_geopolitico` via Claude API
- [ ] `GeradorPerfilPaisService` gerando `analise_lideranca` via Claude API
- [ ] Limite de 5 países por execução respeitado
- [ ] `gerado_em` sendo atualizado após cada geração
- [ ] Command `php artisan paises:gerar-perfis` funcionando
- [ ] Scheduler configurado para toda segunda às 03:00

### API
- [ ] `GET /api/paises` retornando lista com busca por `q`
- [ ] `GET /api/paises/{codigo}` retornando perfil + indicadores do M4
- [ ] `GET /api/paises/{codigo}/eventos` buscando por `termos_busca`
- [ ] `GET /api/meus-paises` retornando países do usuário com perfil eager loaded
- [ ] `POST /api/meus-paises` adicionando país (sem duplicata, respeitando limite por plano)
- [ ] `DELETE /api/meus-paises/{codigo}` removendo país
- [ ] Cache de 30 minutos no Redis para perfis

### Frontend
- [ ] `BuscaPais` com debounce de 300ms funcionando
- [ ] Lista "Meus Países" exibindo países seguidos
- [ ] Estado vazio com instrução quando lista está vazia
- [ ] `PerfilPaisPage` exibindo as 5 seções corretamente
- [ ] Botão "Acompanhar / Acompanhando" toggling corretamente
- [ ] Limite por plano exibido no frontend quando atingido
- [ ] Indicadores econômicos exibidos com variação %
- [ ] Eventos recentes com link para fonte original
- [ ] "Meus Países" adicionado à navegação do dashboard

### Integração com Módulo 2
- [ ] Clique no mapa redireciona para `/paises/{codigo}`
- [ ] Países sem perfil mantêm o RegionPanel como fallback
- [ ] Geração de perfis integrada ao scheduler das segundas-feiras
