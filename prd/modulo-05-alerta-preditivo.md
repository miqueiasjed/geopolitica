# PRD — Módulo 5: Alerta Preditivo
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica  
**Versão:** 1.0  
**Data:** Abril 2026  
**Público:** Desenvolvedor Laravel Sênior implementando do zero

---

## 1. Visão Geral

O Módulo 5 é o **Alerta Preditivo** — o sistema de inteligência mais sofisticado do dashboard. Seu objetivo é monitorar continuamente os eventos coletados pelo Módulo 1, identificar combinações de sinais que historicamente precederam crises geopolíticas e econômicas, e notificar o assinante antes que o evento vire manchete.

Os Módulos 1 a 4 são **reativos** — mostram o que está acontecendo. O Módulo 5 é **preditivo** — identifica o que pode acontecer antes que aconteça. É a entrega mais valiosa do canal e o principal argumento para o plano Reservado.

### O que o sistema monitora

O sistema monitora três categorias de padrões combinados:

| Categoria | Sinais monitorados |
|---|---|
| **Escalada Militar** | Movimentação de tropas, declarações de prontidão, ataques a infraestrutura, bloqueios navais |
| **Retórica Diplomática e Sanções** | Linguagem de ultimato, expulsão de diplomatas, sanções incrementais, vetos em organismos |
| **Cortes de Fornecimento** | Restrições a exportação, bloqueios de rotas, cortes de gás ou grãos, crise alimentar emergente |

Quando dois ou mais sinais de categorias **diferentes** convergem na mesma região em curto período, o sistema dispara um alerta. O alerta chega ao assinante de duas formas simultâneas: notificação no dashboard (badge + painel) e e-mail transacional via Resend.

### Arquitetura em três camadas

```
Camada 1 (Detecção)    → varre events das últimas 48h, IA classifica sinais → pattern_signals
Camada 2 (Convergência) → verifica se 2+ categorias convergem por região → predictive_alerts
Camada 3 (Entrega)      → badge no dashboard + e-mail via Resend
```

Cada camada é independente. Uma falha em qualquer uma não derruba as demais.

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| **Backend framework** | Laravel 13 |
| **Banco de dados** | MySQL 8.x |
| **Cache / Filas** | Redis |
| **Autenticação** | Laravel Sanctum |
| **Autorização** | Spatie Laravel Permission |
| **Fila de Jobs** | Laravel Queue (driver: redis) |
| **Agendamento** | Laravel Scheduler |
| **E-mail** | Resend (via HTTP + classe Mail do Laravel) |
| **IA** | Claude API (Anthropic SDK PHP) |
| **Frontend** | React SPA (Vite + React + TypeScript + TailwindCSS) |
| **Estado/Fetch** | React Query (TanStack Query v5) |
| **Roteamento SPA** | React Router v7 |
| **Notificações** | Laravel Notifications (mail + database) |

---

## 3. Dependências de Outros Módulos

| Módulo | O que usa |
|---|---|
| **Módulo 1** | Tabela `eventos` — fonte dos eventos analisados pela IA |
| **Módulo 3** | Tabela `assinantes` e `users` — destinatários dos e-mails |
| **Módulo 4** | Tabela `indicadores` — correlação com commodities na análise de convergência |

**Pré-requisitos obrigatórios antes de implementar o M5:**
- M1 em produção com tabela `eventos` populada com pelo menos 7 dias de histórico
- M3 em produção com tabela `assinantes` contendo `user_id` e e-mails válidos
- M4 em produção com tabela `indicadores`

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|---|---|
| **Prazo MVP** | 5 dias de desenvolvimento |
| **Custo de implementação** | R$ 10.000 – R$ 22.000 |
| **Custo mensal adicional** | R$ 50–300 (Claude API + Resend) |
| **Resend free tier** | Até 3.000 e-mails/mês gratuitos |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Console/
│   └── Commands/
│       ├── DetectarSinais.php               ← Camada 1: detecta sinais nos eventos
│       ├── AnalisarConvergencia.php         ← Camada 2: analisa convergência e gera alertas
│       └── EnviarEmailsAlerta.php           ← Camada 3: envia e-mails via Resend
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       └── AlertaController.php         ← lista alertas, marca como lido
│   ├── Requests/
│   │   └── MarcarAlertaLidoRequest.php
│   └── Middleware/
│       └── VerificarAssinante.php
├── Jobs/
│   ├── DetectarSinaisJob.php
│   ├── AnalisarConvergenciaJob.php
│   └── EnviarEmailAlertaJob.php
├── Mail/
│   └── AlertaPreditivo.php                  ← Mailable para o e-mail de alerta
├── Models/
│   ├── SinalPadrao.php
│   ├── AlertaPreditivo.php
│   └── AlertaLeitura.php
├── Notifications/
│   └── NovoAlertaGeopolítico.php
├── Services/
│   ├── DetectorSinaisService.php
│   ├── AnalisadorConvergenciaService.php
│   └── EntregaAlertaService.php
database/
├── migrations/
│   ├── xxxx_create_sinais_padrao_table.php
│   ├── xxxx_create_alertas_preditivos_table.php
│   └── xxxx_create_alertas_leituras_table.php
resources/
└── views/
    └── emails/
        └── alerta-preditivo.blade.php
routes/
└── api.php
```

### 5.2 Models e Migrations (Schema Completo)

#### Migration: `sinais_padrao`

```php
Schema::create('sinais_padrao', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('evento_id')->nullable();
    $table->foreign('evento_id')->references('id')->on('eventos')->nullOnDelete();
    $table->enum('tipo_padrao', ['military', 'diplomatic', 'supply']);
    $table->string('nome_sinal');           // ex: "Movimentação de tropas"
    $table->string('regiao');              // ex: "Oriente Médio"
    $table->unsignedTinyInteger('peso');   // 2–4
    $table->float('confianca')->default(0.7); // 0.0 a 1.0 — confiança da IA
    $table->timestamp('detectado_em')->useCurrent();
    $table->timestamps();

    $table->index(['regiao', 'detectado_em']);
    $table->index('tipo_padrao');
    $table->index('evento_id');
});
```

**Model `SinalPadrao`:**
```php
// app/Models/SinalPadrao.php
protected $table = 'sinais_padrao';
protected $fillable = [
    'evento_id', 'tipo_padrao', 'nome_sinal',
    'regiao', 'peso', 'confianca', 'detectado_em',
];
protected $casts = [
    'confianca'    => 'float',
    'detectado_em' => 'datetime',
];

public function evento(): BelongsTo
{
    return $this->belongsTo(Evento::class);
}
```

---

#### Migration: `alertas_preditivos`

```php
Schema::create('alertas_preditivos', function (Blueprint $table) {
    $table->id();
    $table->enum('nivel', ['critical', 'high', 'medium']);
    $table->string('regiao');
    $table->string('titulo');
    $table->text('analise');             // análise gerada pela IA
    $table->json('resumo_sinais');       // sinais que dispararam o alerta
    $table->unsignedSmallInteger('peso_total');
    $table->json('tipos_padrao');        // categorias convergentes: ["military","supply"]
    $table->boolean('ativo')->default(true);
    $table->timestamp('notificado_em')->nullable(); // quando e-mail foi enviado
    $table->timestamps();

    $table->index(['ativo', 'created_at']);
    $table->index(['regiao', 'created_at']);
});
```

**Model `AlertaPreditivo`:**
```php
// app/Models/AlertaPreditivo.php
protected $table = 'alertas_preditivos';
protected $fillable = [
    'nivel', 'regiao', 'titulo', 'analise',
    'resumo_sinais', 'peso_total', 'tipos_padrao',
    'ativo', 'notificado_em',
];
protected $casts = [
    'resumo_sinais'  => 'array',
    'tipos_padrao'   => 'array',
    'ativo'          => 'boolean',
    'notificado_em'  => 'datetime',
];

public function leituras(): HasMany
{
    return $this->hasMany(AlertaLeitura::class, 'alerta_id');
}

public function foiLidoPor(int $userId): bool
{
    return $this->leituras()->where('user_id', $userId)->exists();
}
```

---

#### Migration: `alertas_leituras`

```php
Schema::create('alertas_leituras', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('alerta_id');
    $table->foreign('alerta_id')->references('id')->on('alertas_preditivos')->cascadeOnDelete();
    $table->unsignedBigInteger('user_id');
    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
    $table->timestamp('lido_em')->useCurrent();
    $table->timestamps();

    $table->unique(['alerta_id', 'user_id']);
    $table->index('user_id');
});
```

**Model `AlertaLeitura`:**
```php
// app/Models/AlertaLeitura.php
protected $table = 'alertas_leituras';
protected $fillable = ['alerta_id', 'user_id', 'lido_em'];
protected $casts = ['lido_em' => 'datetime'];
```

---

### 5.3 Services

#### `DetectorSinaisService`
**Responsabilidades:**
- Buscar eventos das últimas 48h que ainda não têm sinais detectados (via `LEFT JOIN sinais_padrao`)
- Processar eventos em lotes de 5 para controle de rate limit da Claude API
- Para cada evento, enviar prompt à Claude API e parsear o JSON de resposta
- Salvar os sinais detectados em `sinais_padrao` com `confianca` e `peso`
- Retornar contagem de sinais inseridos

**Métodos principais:**
```php
public function executar(): int
public function detectarSinaisNoEvento(Evento $evento): array
private function chamarClaudeApi(string $prompt): array
private function parsearResposta(string $resposta, int $eventoId, string $regiao): array
```

#### `AnalisadorConvergenciaService`
**Responsabilidades:**
- Buscar sinais das últimas `CONVERGENCIA_JANELA_HORAS` horas com `confianca >= 0.6`
- Agrupar sinais por região
- Para cada região: calcular peso total, verificar se há 2+ categorias distintas
- Verificar threshold (`ALERTA_THRESHOLD_CRITICAL`, `ALERTA_THRESHOLD_HIGH`, `ALERTA_THRESHOLD_MEDIUM`)
- Evitar alertas duplicados para a mesma região nas últimas 48h
- Gerar análise textual via Claude API
- Salvar alertas em `alertas_preditivos`
- Disparar `EnviarEmailAlertaJob` se novos alertas foram criados

**Métodos principais:**
```php
public function executar(): int
private function analisarRegiao(string $regiao, array $sinais): ?AlertaPreditivo
private function calcularNivel(int $pesoTotal): string
private function existeAlertaRecenteParaRegiao(string $regiao): bool
private function gerarAnaliseIA(string $regiao, array $sinais, string $nivel): array
```

#### `EntregaAlertaService`
**Responsabilidades:**
- Buscar alertas ativos com `notificado_em` nulo
- Buscar todos os usuários com role `assinante_reservado` ou superior
- Enviar e-mail via Resend usando Mailable do Laravel
- Processar envios em lotes de 50 (limite do Resend)
- Atualizar `notificado_em` após envio bem-sucedido
- Registrar falhas de envio no log sem derrubar o processo

**Métodos principais:**
```php
public function executar(): int
private function buscarDestinatarios(): Collection
private function enviarLote(AlertaPreditivo $alerta, array $emails): void
private function marcarComoNotificado(AlertaPreditivo $alerta): void
```

---

### 5.4 FormRequests

```php
// app/Http/Requests/MarcarAlertaLidoRequest.php
public function authorize(): bool
{
    // Verifica se o alerta existe e o usuário tem permissão
    return auth()->check();
}

public function rules(): array
{
    return []; // Sem campos no body — ID vem via route parameter
}
```

---

### 5.5 Controllers e Rotas

**`AlertaController`** (controlador fino):
```php
// app/Http/Controllers/Api/AlertaController.php

public function __construct(
    private readonly AlertaPreditivoService $alertaService
) {}

// GET /api/alertas — lista alertas não lidos do usuário autenticado
public function index(Request $request): JsonResponse
{
    // Delega para AlertaPreditivoService::alertasNaoLidos(int $userId)
}

// POST /api/alertas/{id}/lido — marca alerta como lido
public function marcarLido(MarcarAlertaLidoRequest $request, int $id): JsonResponse
{
    // Delega para AlertaPreditivoService::marcarComoLido(int $alertaId, int $userId)
}
```

**`routes/api.php`:**
```php
// Rotas públicas de saúde (sem auth)
Route::get('/health', fn() => response()->json(['status' => 'ok']));

// Rotas autenticadas — qualquer assinante
Route::middleware(['auth:sanctum', 'role:assinante_essencial|assinante_pro|assinante_reservado|admin'])
    ->prefix('alertas')
    ->group(function () {
        Route::get('/',          [AlertaController::class, 'index']);
        Route::post('/{id}/lido', [AlertaController::class, 'marcarLido']);
    });

// Rotas internas do scheduler (protegidas por CRON_SECRET no middleware)
Route::middleware('cron.secret')
    ->prefix('interno')
    ->group(function () {
        Route::post('/detectar-sinais',       [CronAlertaController::class, 'detectarSinais']);
        Route::post('/analisar-convergencia', [CronAlertaController::class, 'analisarConvergencia']);
        Route::post('/enviar-emails-alerta',  [CronAlertaController::class, 'enviarEmails']);
    });
```

---

## 6. Endpoints da API

### `GET /api/alertas`
**Middleware:** `auth:sanctum`, role assinante ou admin  
**Body/Params:** Nenhum  
**Resposta:**
```json
{
  "alertas": [
    {
      "id": 1,
      "nivel": "critical",
      "regiao": "Oriente Médio",
      "titulo": "Convergência militar e energética detectada no Estreito de Ormuz",
      "analise": "Três sinais distintos convergem em 72h: movimentação naval iraniana, corte parcial de fornecimento de petróleo e retórica de represália após sanções americanas. Padrão similar ao observado em 2019 precedeu alta de 18% no Brent em 10 dias.",
      "nivel_label": "CRÍTICO",
      "peso_total": 11,
      "tipos_padrao": ["military", "supply"],
      "created_at": "2026-04-14T09:30:00Z"
    }
  ],
  "nao_lidos": 1
}
```

---

### `POST /api/alertas/{id}/lido`
**Middleware:** `auth:sanctum`, role assinante ou admin  
**Params:** `id` (integer, route param)  
**Body:** Nenhum  
**Resposta:**
```json
{ "sucesso": true }
```
**Errors:**
```json
// 404 — alerta não encontrado
{ "mensagem": "Alerta não encontrado.", "codigo": "ALERTA_NAO_ENCONTRADO" }
// 409 — já foi marcado como lido
{ "mensagem": "Alerta já marcado como lido.", "codigo": "JA_LIDO" }
```

---

### `POST /api/interno/detectar-sinais`
**Middleware:** `cron.secret` (header `X-Cron-Secret`)  
**Resposta:**
```json
{ "sinais_detectados": 12, "eventos_analisados": 8 }
```

---

### `POST /api/interno/analisar-convergencia`
**Middleware:** `cron.secret`  
**Resposta:**
```json
{ "alertas_criados": 2, "regioes_analisadas": 5 }
```

---

### `POST /api/interno/enviar-emails-alerta`
**Middleware:** `cron.secret`  
**Resposta:**
```json
{ "emails_enviados": 143, "alertas_processados": 2 }
```

---

## 7. Frontend React

### Componentes Principais

```
src/
├── components/
│   ├── AlertaBadge.tsx         ← badge pulsante na navbar
│   └── AlertaPanel.tsx         ← painel deslizante com alertas ativos
├── hooks/
│   └── useAlertas.ts           ← hook React Query para buscar alertas
├── services/
│   └── alertasApi.ts           ← funções de fetch para a API
└── pages/
    └── Dashboard.tsx           ← layout principal com AlertaBadge na navbar
```

### `useAlertas.ts`
```typescript
// Polling a cada 5 minutos para verificar novos alertas
export function useAlertas() {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: () => alertasApi.listarNaoLidos(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMarcarAlertaLido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertasApi.marcarLido(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas'] }),
  });
}
```

### `AlertaBadge.tsx`
- Exibe ícone de sino na navbar
- Badge vermelho pulsante com contagem de não lidos (`animate-pulse`)
- Ao clicar, abre `AlertaPanel`
- Polling via `useAlertas` a cada 5 minutos

### `AlertaPanel.tsx`
Painel deslizante (posição fixed, right-0) com lista de alertas não lidos:
- Badge colorido por nível: `critical` → vermelho, `high` → laranja, `medium` → amarelo
- Título e análise do alerta
- Botão "Marcar como lido" — chama mutation e remove do painel imediatamente

### Fluxo de dados com React Query
```
Componente AlertaBadge
  → useAlertas() [React Query, polling 5min]
    → GET /api/alertas
      → Retorna { alertas[], nao_lidos }

Botão "Marcar como lido"
  → useMarcarAlertaLido().mutate(id)
    → POST /api/alertas/{id}/lido
      → invalidateQueries(['alertas'])
        → Refetch automático → badge atualiza
```

### Estilos por nível de alerta
```typescript
const ESTILOS_NIVEL = {
  critical: {
    cor: 'text-red-400',
    borda: 'border-red-400/40',
    fundo: 'bg-red-400/5',
    label: 'CRÍTICO'
  },
  high: {
    cor: 'text-orange-400',
    borda: 'border-orange-400/40',
    fundo: 'bg-orange-400/5',
    label: 'ALTO'
  },
  medium: {
    cor: 'text-yellow-400',
    borda: 'border-yellow-400/40',
    fundo: 'bg-yellow-400/5',
    label: 'MÉDIO'
  },
};
```

---

## 8. Agendamentos (Laravel Scheduler)

```php
// app/Console/Kernel.php (ou bootstrap/app.php no Laravel 13)

Schedule::command('alertas:detectar-sinais')
    ->hourly()
    ->withoutOverlapping()
    ->onFailure(fn() => Log::error('Falha ao detectar sinais'));

Schedule::command('alertas:analisar-convergencia')
    ->hourlyAt(5) // 5 minutos após a detecção
    ->withoutOverlapping()
    ->onFailure(fn() => Log::error('Falha ao analisar convergência'));

// O envio de e-mails é disparado pelo próprio AnalisadorConvergenciaService
// via dispatch(new EnviarEmailAlertaJob()) quando há novos alertas
```

**Commands:**
```bash
php artisan alertas:detectar-sinais
php artisan alertas:analisar-convergencia
```

---

## 9. Jobs / Queues

### `DetectarSinaisJob`
```php
// Executa a detecção de sinais em background (opcional — pode ser síncrono no scheduler)
// Queue: 'alertas'
// Tries: 3
// Timeout: 300 segundos (5 min)
```

### `AnalisarConvergenciaJob`
```php
// Queue: 'alertas'
// Tries: 3
// Timeout: 120 segundos
```

### `EnviarEmailAlertaJob`
```php
// Disparado quando novos alertas são criados
// Queue: 'emails'
// Tries: 3
// Timeout: 180 segundos
// Backoff: [30, 60, 120] segundos entre retentativas
```

**Configuração no `.env`:**
```env
QUEUE_CONNECTION=redis
REDIS_QUEUE_ALERTAS=alertas
REDIS_QUEUE_EMAILS=emails
```

**Workers em produção:**
```bash
php artisan queue:work redis --queue=alertas,emails --tries=3 --sleep=3
```

---

## 10. Controle de Acesso

| Role | Pode ver alertas | Recebe e-mail | Acesso ao painel |
|---|---|---|---|
| `assinante_essencial` | Sim (alertas `medium`) | Não | Sim |
| `assinante_pro` | Sim (alertas `medium` + `high`) | Não | Sim |
| `assinante_reservado` | Sim (todos os níveis) | **Sim** | Sim |
| `admin` | Sim (todos os níveis) | **Sim** | Sim |

**Lógica de acesso por nível no `AlertaPreditivoService`:**
```php
public function alertasNaoLidos(User $user): Collection
{
    $query = AlertaPreditivo::query()
        ->where('ativo', true)
        ->where('created_at', '>=', now()->subHours(72))
        ->whereNotIn('id', function ($q) use ($user) {
            $q->select('alerta_id')
              ->from('alertas_leituras')
              ->where('user_id', $user->id);
        });

    // Filtro por nível conforme o plano
    if ($user->hasRole('assinante_essencial')) {
        $query->where('nivel', 'medium');
    } elseif ($user->hasRole('assinante_pro')) {
        $query->whereIn('nivel', ['medium', 'high']);
    }
    // assinante_reservado e admin: sem filtro adicional

    return $query->orderByDesc('created_at')->get();
}
```

---

## 11. Error Handling

| Situação | HTTP | Código interno | Mensagem |
|---|---|---|---|
| Não autenticado | 401 | `NAO_AUTENTICADO` | "Autenticação necessária." |
| Sem permissão de role | 403 | `SEM_PERMISSAO` | "Seu plano não permite acesso a este recurso." |
| Alerta não encontrado | 404 | `ALERTA_NAO_ENCONTRADO` | "Alerta não encontrado." |
| Alerta já lido | 409 | `JA_LIDO` | "Alerta já marcado como lido." |
| Falha na Claude API | 500 | `FALHA_IA` | "Erro ao processar análise. Tente novamente." |
| Falha no envio de e-mail | 500 | `FALHA_EMAIL` | "Erro ao enviar notificação. Será retentada automaticamente." |
| Cron secret inválido | 401 | `CRON_SECRET_INVALIDO` | "Acesso não autorizado." |

**Handler global (`app/Exceptions/Handler.php`):**
```php
// Todas as respostas de erro da API seguem o padrão:
{
  "mensagem": "Descrição do erro.",
  "codigo": "CODIGO_INTERNO",
  "erros": {} // opcional, para erros de validação
}
```

**Variáveis de ambiente necessárias:**
```env
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=alertas@seudominio.com
CRON_SECRET=string-aleatoria-segura
ALERTA_THRESHOLD_CRITICAL=10
ALERTA_THRESHOLD_HIGH=7
ALERTA_THRESHOLD_MEDIUM=4
CONVERGENCIA_JANELA_HORAS=72
```

---

## 12. Checklist de Entrega

### Banco de dados
- [ ] Migration `sinais_padrao` executada com índices corretos
- [ ] Migration `alertas_preditivos` executada
- [ ] Migration `alertas_leituras` executada com constraint `UNIQUE(alerta_id, user_id)`
- [ ] Models criados com `$casts` corretos

### Camada 1 — Detecção de Sinais
- [ ] `DetectorSinaisService` analisando eventos via Claude API
- [ ] Sinais salvos em `sinais_padrao` com `confianca` correto
- [ ] Eventos já analisados não sendo re-analisados (anti-duplicate via subquery)
- [ ] Processamento em lotes de 5 com pausa entre lotes (rate limit)
- [ ] Command `php artisan alertas:detectar-sinais` funcionando

### Camada 2 — Convergência
- [ ] `AnalisadorConvergenciaService` agrupando sinais por região
- [ ] Threshold de 2 categorias mínimas sendo respeitado
- [ ] Níveis `critical/high/medium` calculados corretamente
- [ ] Alertas duplicados em 48h sendo evitados
- [ ] Análise textual gerada pela IA com `titulo` e `analise`
- [ ] `EnviarEmailAlertaJob` disparado automaticamente quando há novos alertas
- [ ] Command `php artisan alertas:analisar-convergencia` funcionando

### Camada 3 — Entrega
- [ ] Resend configurado com domínio verificado
- [ ] `AlertaPreditivo` Mailable renderizando corretamente
- [ ] E-mails enviados apenas para `assinante_reservado` e `admin`
- [ ] Envio em lotes de 50
- [ ] Campo `notificado_em` atualizado após envio
- [ ] Scheduler configurado com `hourly()` e `withoutOverlapping()`

### Frontend
- [ ] `AlertaBadge` exibindo contagem correta de não lidos
- [ ] Badge visível apenas quando há alertas não lidos
- [ ] `AlertaPanel` listando alertas com nível e análise
- [ ] "Marcar como lido" funcionando e removendo do painel imediatamente
- [ ] Polling a cada 5 minutos sem bloquear a UI
- [ ] Badge desaparecendo quando todos os alertas são lidos
- [ ] Controle de acesso por nível no frontend (essencial vê só `medium`, etc.)

### Controle de acesso
- [ ] Roles do Spatie Permission criadas: `assinante_essencial`, `assinante_pro`, `assinante_reservado`, `admin`
- [ ] Middleware de role aplicado nas rotas
- [ ] Filtro por nível de alerta conforme role do usuário

### Teste end-to-end
- [ ] Evento criado → sinal detectado → alerta gerado → e-mail enviado → badge aparece → painel abre → marcar como lido → badge some
