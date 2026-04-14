# PRD — Módulo 10: Integração Hotmart (Pagamentos)
**Projeto:** Geopolítica para Investidores  
**Versão:** 2.0 (Stack Laravel + React)  
**Data:** Abril 2026  
**Depende de:** Módulo 00 concluído (tabelas `users` e `assinantes`, roles Spatie)  
**Prazo MVP:** 3 dias de desenvolvimento  
**Custo Estimado:** R$ 4.000 – R$ 9.000  
**Custo Mensal Adicional:** R$ 0 (Resend já incluso no plano base do produto)

---

## 1. Visão Geral

O Módulo 10 conecta a Hotmart ao Laravel via webhook, automatizando completamente o ciclo de vida do assinante — da compra ao cancelamento.

**O que muda operacionalmente após este módulo:**

| Antes | Depois |
|---|---|
| Admin cria usuário manualmente após cada venda | Compra na Hotmart → webhook → conta criada em segundos |
| Admin desativa manualmente após cancelamento/chargeback | Evento Hotmart → webhook → acesso bloqueado automaticamente |
| Upgrade/downgrade exige intervenção manual no banco | Mudança de plano na Hotmart → role e acesso atualizados em tempo real |

**Eventos da Hotmart processados:**

| Evento Hotmart | Gatilho | Ação no sistema | E-mail enviado |
|---|---|---|---|
| `PURCHASE_APPROVED` | Compra aprovada (cartão, PIX, boleto) | Criar User + Assinante + assignRole | Boas-vindas com link de definição de senha |
| `PURCHASE_COMPLETE` | Pagamento confirmado (PIX/boleto) | Ativar se ainda não ativo | Acesso liberado (apenas se necessário) |
| `PURCHASE_CANCELED` | Assinante cancelou manualmente | `ativo = false`, `status = cancelado` | Confirmação de cancelamento |
| `PURCHASE_REFUNDED` | Reembolso aprovado | `ativo = false`, `status = reembolsado` | Confirmação de reembolso |
| `PURCHASE_CHARGEBACK` | Chargeback no cartão | `ativo = false`, `status = chargeback` | Notificação interna ao admin |
| `PURCHASE_EXPIRED` | Assinatura expirou sem renovação | `ativo = false`, `status = expirado` | Lembrete de renovação |
| `SWITCH_PLAN` | Assinante mudou de plano | Atualizar plano + role | Confirmação de mudança |

**Segurança do webhook:** Validação do header `x-hotmart-webhook-token` contra `HOTMART_WEBHOOK_SECRET`. Endpoint **sempre** retorna HTTP 200 para evitar reenvios em loop da Hotmart.

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend framework | Laravel 13 |
| Autorização | Spatie Laravel Permission |
| Banco de dados | MySQL 8.0 |
| Filas (e-mails assíncronos) | Redis + Laravel Queue |
| E-mail transacional | Resend via `resend/resend-laravel` + Blade |
| Frontend (painel admin) | React 19 + Vite + TypeScript + TailwindCSS |
| Estado servidor | TanStack React Query v5 |

---

## 3. Dependências de Outros Módulos

| Módulo | O que é necessário |
|---|---|
| M00 | Tabelas `users` e `assinantes` (com todos os campos), roles Spatie criados, middleware `assinante.ativo` |

---

## 4. Prazo MVP e Custo Estimado

| Item | Detalhe |
|---|---|
| Prazo MVP | 3 dias |
| Custo desenvolvimento | R$ 4.000 – R$ 9.000 |
| Custo mensal adicional | R$ 0 |
| Dia 1 | Migration `webhook_eventos`, variáveis de ambiente, `WebhookHotmartController`, log de eventos |
| Dia 2 | `HotmartHandlerService` com todos os handlers, 4 templates Blade de e-mail |
| Dia 3 | Painel admin React (`AdminAssinantes`, `AdminWebhookEventos`), testes com sandbox Hotmart |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   └── Controllers/
│       ├── Webhooks/
│       │   └── WebhookHotmartController.php    ← recebe e processa webhooks
│       └── Admin/
│           ├── AdminAssinantesController.php   ← lista assinantes (role admin)
│           └── AdminWebhookEventosController.php ← log de eventos (role admin)
├── Models/
│   └── WebhookEvento.php                       ← log auditável de todos os eventos
├── Services/
│   └── HotmartHandlerService.php               ← lógica de negócio por tipo de evento
└── Mail/
    ├── BoasVindasMail.php
    ├── CancelamentoMail.php
    ├── MudancaPlanoMail.php
    └── RenovacaoLembreteMail.php

routes/
└── api.php

database/
└── migrations/
    └── xxxx_create_webhook_eventos_table.php

resources/
└── views/
    └── emails/
        ├── boas-vindas.blade.php
        ├── cancelamento.blade.php
        ├── mudanca-plano.blade.php
        └── renovacao-lembrete.blade.php

config/
└── services.php    ← entradas hotmart.* e resend.*
```

---

### 5.2 Models e Migrations

#### Nota sobre a tabela `assinantes`

A tabela `assinantes` criada no M00 já contém todos os campos necessários para o M10:
- `hotmart_subscription_id` (UNIQUE)
- `hotmart_product_id`
- `status` (ativo | cancelado | reembolsado | chargeback | expirado)
- `email` (espelhado para buscas sem JOIN com `users`)
- `plano_iniciado_em`

**Nenhuma migration adicional é necessária na tabela `assinantes`.**

---

#### Migration: `webhook_eventos`

Log completo e imutável de todos os eventos recebidos da Hotmart. Fundamental para auditoria, diagnóstico e reprocessamento manual.

```php
// database/migrations/xxxx_create_webhook_eventos_table.php
Schema::create('webhook_eventos', function (Blueprint $table) {
    $table->id();
    $table->string('tipo_evento', 60)
          ->comment('Ex: PURCHASE_APPROVED, SWITCH_PLAN');
    $table->string('hotmart_evento_id')->nullable()
          ->comment('ID único do evento na Hotmart, se disponível no payload');
    $table->string('email_comprador')->nullable()->index();
    $table->string('nome_comprador')->nullable();
    $table->string('produto_id')->nullable();
    $table->string('subscription_id')->nullable();
    $table->string('plano_detectado', 30)->nullable()
          ->comment('Plano mapeado a partir do produto_id: essencial | pro | reservado');
    $table->json('payload')
          ->comment('Payload completo recebido da Hotmart — nunca truncar');
    $table->string('status', 20)
          ->default('processado')
          ->comment('processado | falhou | ignorado');
    $table->text('mensagem_erro')->nullable();
    $table->timestamp('processado_em')->useCurrent();
    $table->timestamps();

    $table->index(['tipo_evento', 'processado_em']);
    $table->index(['status', 'processado_em']);
    $table->index('email_comprador');
    $table->index('subscription_id');
});
```

**Schema completo da tabela `webhook_eventos`:**

| Coluna | Tipo MySQL | Nullable | Default | Índice |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | NÃO | — | PRIMARY KEY |
| `tipo_evento` | VARCHAR(60) | NÃO | — | INDEX com processado_em |
| `hotmart_evento_id` | VARCHAR(255) | SIM | NULL | — |
| `email_comprador` | VARCHAR(255) | SIM | NULL | INDEX |
| `nome_comprador` | VARCHAR(255) | SIM | NULL | — |
| `produto_id` | VARCHAR(255) | SIM | NULL | — |
| `subscription_id` | VARCHAR(255) | SIM | NULL | INDEX |
| `plano_detectado` | VARCHAR(30) | SIM | NULL | — |
| `payload` | JSON | NÃO | — | — |
| `status` | VARCHAR(20) | NÃO | `'processado'` | INDEX com processado_em |
| `mensagem_erro` | TEXT | SIM | NULL | — |
| `processado_em` | TIMESTAMP | NÃO | `CURRENT_TIMESTAMP` | — |
| `created_at` | TIMESTAMP | SIM | NULL | — |
| `updated_at` | TIMESTAMP | SIM | NULL | — |

#### Model: `WebhookEvento`

```php
// app/Models/WebhookEvento.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvento extends Model
{
    protected $table = 'webhook_eventos';

    protected $fillable = [
        'tipo_evento', 'hotmart_evento_id', 'email_comprador',
        'nome_comprador', 'produto_id', 'subscription_id',
        'plano_detectado', 'payload', 'status', 'mensagem_erro', 'processado_em',
    ];

    protected $casts = [
        'payload'       => 'array',
        'processado_em' => 'datetime',
    ];
}
```

---

### 5.3 Services

#### `HotmartHandlerService`

**Responsabilidades:**
- Centralizar toda a lógica de negócio dos handlers
- Criar usuários, ativar/desativar assinaturas e sincronizar roles
- Disparar e-mails transacionais em fila (assíncrono)
- Ser testável independentemente do controller

```php
// app/Services/HotmartHandlerService.php
namespace App\Services;

use App\Models\Assinante;
use App\Models\User;
use App\Models\WebhookEvento;
use App\Mail\BoasVindasMail;
use App\Mail\CancelamentoMail;
use App\Mail\MudancaPlanoMail;
use App\Mail\RenovacaoLembreteMail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class HotmartHandlerService
{
    /**
     * Detecta o plano interno a partir do ID do produto na Hotmart.
     */
    public function detectarPlano(?string $produtoId): string
    {
        return match ($produtoId) {
            config('services.hotmart.produto_reservado') => 'reservado',
            config('services.hotmart.produto_pro')       => 'pro',
            default                                      => 'essencial',
        };
    }

    /**
     * Despacha para o handler correto com base no tipo de evento.
     */
    public function processar(array $dados): void
    {
        match ($dados['tipo_evento']) {
            'PURCHASE_APPROVED',
            'PURCHASE_COMPLETE'   => $this->handleCompra($dados),
            'PURCHASE_CANCELED'   => $this->handleCancelamento($dados, 'cancelado'),
            'PURCHASE_REFUNDED'   => $this->handleCancelamento($dados, 'reembolsado'),
            'PURCHASE_CHARGEBACK' => $this->handleChargeback($dados),
            'PURCHASE_EXPIRED'    => $this->handleExpiracao($dados),
            'SWITCH_PLAN'         => $this->handleMudancaPlano($dados),
            default               => $this->handleIgnorado($dados),
        };
    }

    // ── COMPRA APROVADA ───────────────────────────────────────────────────────
    private function handleCompra(array $dados): void
    {
        $email = $dados['email_comprador'];
        $nome  = $dados['nome_comprador'];
        $plano = $dados['plano_detectado'];

        // Verificar se usuário já existe (re-compra ou reativação)
        $usuario       = User::where('email', $email)->first();
        $usuarioCriado = false;

        if (!$usuario) {
            // Criar conta com senha temporária aleatória
            // O usuário vai redefinir via link no e-mail de boas-vindas
            $usuario = User::create([
                'name'     => $nome,
                'email'    => $email,
                'password' => Hash::make(Str::password(20)),
            ]);
            $usuarioCriado = true;
        }

        // Garantir que o usuário tem somente o role correspondente ao plano atual
        $usuario->syncRoles(["assinante_{$plano}"]);

        // Criar ou atualizar registro do assinante
        Assinante::updateOrCreate(
            ['user_id' => $usuario->id],
            [
                'plano'                   => $plano,
                'ativo'                   => true,
                'status'                  => 'ativo',
                'email'                   => $email,
                'hotmart_subscription_id' => $dados['subscription_id'],
                'hotmart_product_id'      => $dados['produto_id'],
                'plano_iniciado_em'       => now(),
            ]
        );

        // Enviar e-mail de boas-vindas apenas na criação da conta
        // Re-compras/reativações não recebem novo e-mail de boas-vindas
        if ($usuarioCriado) {
            // Laravel Password Reset gera o link para o usuário definir a senha
            $token            = Password::createToken($usuario);
            $frontendUrl      = rtrim(config('app.frontend_url'), '/');
            $linkDefinirSenha = "{$frontendUrl}/redefinir-senha?token={$token}&email=" . urlencode($email);

            Mail::to($email)->queue(
                new BoasVindasMail(
                    nome: $nome,
                    plano: $plano,
                    linkAcesso: $linkDefinirSenha
                )
            );
        }
    }

    // ── CANCELAMENTO / REEMBOLSO ──────────────────────────────────────────────
    private function handleCancelamento(array $dados, string $novoStatus): void
    {
        $email = $dados['email_comprador'];

        $assinante = Assinante::where('email', $email)->first();
        if (!$assinante) {
            // Assinante não existe no sistema — evento ignorado
            return;
        }

        $assinante->update(['ativo' => false, 'status' => $novoStatus]);

        Mail::to($email)->queue(
            new CancelamentoMail(
                nome: $dados['nome_comprador'],
                status: $novoStatus
            )
        );
    }

    // ── CHARGEBACK ────────────────────────────────────────────────────────────
    private function handleChargeback(array $dados): void
    {
        Assinante::where('email', $dados['email_comprador'])
                 ->update(['ativo' => false, 'status' => 'chargeback']);

        // Notifica o admin (não o assinante) sobre o chargeback
        $emailAdmin = config('mail.from.address');
        Mail::to($emailAdmin)->queue(
            new CancelamentoMail(
                nome: $dados['nome_comprador'],
                status: 'chargeback',
                emailAssinante: $dados['email_comprador'],
                isNotificacaoAdmin: true
            )
        );
    }

    // ── EXPIRAÇÃO ─────────────────────────────────────────────────────────────
    private function handleExpiracao(array $dados): void
    {
        Assinante::where('email', $dados['email_comprador'])
                 ->update(['ativo' => false, 'status' => 'expirado']);

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        Mail::to($dados['email_comprador'])->queue(
            new RenovacaoLembreteMail(
                nome: $dados['nome_comprador'],
                plano: $dados['plano_detectado'],
                linkRenovacao: "{$frontendUrl}/#planos"
            )
        );
    }

    // ── MUDANÇA DE PLANO ──────────────────────────────────────────────────────
    private function handleMudancaPlano(array $dados): void
    {
        $email     = $dados['email_comprador'];
        $novoPlano = $dados['plano_detectado'];

        $assinante = Assinante::where('email', $email)->with('user')->first();

        if (!$assinante) {
            // Assinante não encontrado — pode ser uma compra nova disfarçada de SWITCH_PLAN
            // Tratar como compra
            $this->handleCompra($dados);
            return;
        }

        $planoAnterior = $assinante->plano;

        $assinante->update([
            'plano'              => $novoPlano,
            'ativo'              => true,
            'status'             => 'ativo',
            'hotmart_product_id' => $dados['produto_id'],
            'plano_iniciado_em'  => now(),
        ]);

        // Sincronizar role — remove o anterior, atribui o novo
        $assinante->user->syncRoles(["assinante_{$novoPlano}"]);

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        Mail::to($email)->queue(
            new MudancaPlanoMail(
                nome: $dados['nome_comprador'],
                planoAnterior: $planoAnterior,
                novoPlano: $novoPlano,
                linkDashboard: "{$frontendUrl}/dashboard"
            )
        );
    }

    // ── EVENTO DESCONHECIDO ───────────────────────────────────────────────────
    private function handleIgnorado(array $dados): void
    {
        // Apenas atualiza o status do log para 'ignorado'
        // O evento já foi registrado antes de chamar processar()
        WebhookEvento::where('tipo_evento', $dados['tipo_evento'])
                     ->where('email_comprador', $dados['email_comprador'])
                     ->latest('processado_em')
                     ->limit(1)
                     ->update(['status' => 'ignorado']);
    }
}
```

---

### 5.4 FormRequests

Não há FormRequest para o webhook — a validação é feita por token no header, não por campos de formulário. Para os endpoints admin (somente GET com filtros via query string), não é necessário FormRequest.

---

### 5.5 Controllers e Rotas

#### `WebhookHotmartController`

```php
// app/Http/Controllers/Webhooks/WebhookHotmartController.php
namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\WebhookEvento;
use App\Services\HotmartHandlerService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WebhookHotmartController extends Controller
{
    public function __construct(
        private readonly HotmartHandlerService $handler
    ) {}

    /**
     * POST /api/webhooks/hotmart
     * Recebe todos os eventos da Hotmart.
     * NUNCA retorna HTTP != 200 para evitar reenvios em loop.
     */
    public function receber(Request $request): Response
    {
        // 1. Validar token de segurança do header
        $tokenRecebido = $request->header('x-hotmart-webhook-token');
        $tokenEsperado = config('services.hotmart.webhook_secret');

        if (empty($tokenEsperado) || $tokenRecebido !== $tokenEsperado) {
            Log::warning('Hotmart webhook: token inválido', ['ip' => $request->ip()]);
            // Retorna 200 mesmo com token inválido para não expor o endpoint
            return response('Unauthorized', 200);
        }

        // 2. Extrair payload e normalizar campos
        // A Hotmart pode variar levemente a estrutura por tipo de evento
        $payload = $request->all();

        $tipoEvento   = $payload['event'] ?? ($payload['data']['purchase']['status'] ?? 'UNKNOWN');
        $comprador    = $payload['data']['buyer']        ?? [];
        $produto      = $payload['data']['product']      ?? [];
        $subscricao   = $payload['data']['subscription'] ?? [];
        $compra       = $payload['data']['purchase']     ?? [];

        $emailComprador = strtolower(trim($comprador['email'] ?? ''));
        $nomeComprador  = $comprador['name'] ?? '';
        $produtoId      = (string) ($produto['id'] ?? '');
        $subscriptionId = $subscricao['subscriber']['code']
                       ?? $compra['order_date']
                       ?? null;

        $planoDetectado = $this->handler->detectarPlano($produtoId);

        // 3. Registrar evento ANTES de processar (garantia de auditoria)
        $eventoLog = WebhookEvento::create([
            'tipo_evento'      => $tipoEvento,
            'email_comprador'  => $emailComprador,
            'nome_comprador'   => $nomeComprador,
            'produto_id'       => $produtoId,
            'subscription_id'  => $subscriptionId,
            'plano_detectado'  => $planoDetectado,
            'payload'          => $payload,
            'status'           => 'processado',
        ]);

        // 4. Processar evento no handler
        try {
            $this->handler->processar([
                'tipo_evento'     => $tipoEvento,
                'email_comprador' => $emailComprador,
                'nome_comprador'  => $nomeComprador,
                'produto_id'      => $produtoId,
                'subscription_id' => $subscriptionId,
                'plano_detectado' => $planoDetectado,
                'payload'         => $payload,
            ]);
        } catch (\Throwable $e) {
            Log::error('Hotmart webhook handler falhou', [
                'evento_log_id' => $eventoLog->id,
                'tipo'          => $tipoEvento,
                'erro'          => $e->getMessage(),
                'trace'         => $e->getTraceAsString(),
            ]);

            $eventoLog->update([
                'status'        => 'falhou',
                'mensagem_erro' => $e->getMessage(),
            ]);
        }

        // SEMPRE retorna 200 — a Hotmart faz retry se receber outro código
        return response('OK', 200);
    }
}
```

#### `AdminAssinantesController`

```php
// app/Http/Controllers/Admin/AdminAssinantesController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assinante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAssinantesController extends Controller
{
    /**
     * GET /api/admin/assinantes
     */
    public function index(Request $request): JsonResponse
    {
        // Gate/Policy verifica role admin — ou usar middleware 'role:admin' na rota
        abort_unless($request->user()->hasRole('admin'), 403, 'Acesso restrito ao admin.');

        $status  = $request->query('status', 'ativo');
        $plano   = $request->query('plano');
        $busca   = $request->query('q');
        $limite  = 50;

        $query = Assinante::with('user')
            ->where('status', $status)
            ->orderBy('plano_iniciado_em', 'desc');

        if ($plano) {
            $query->where('plano', $plano);
        }

        if ($busca) {
            $query->where('email', 'LIKE', "%{$busca}%");
        }

        $paginado = $query->paginate($limite);

        return response()->json([
            'assinantes' => $paginado->items(),
            'total'      => $paginado->total(),
            'paginas'    => $paginado->lastPage(),
            'pagina'     => $paginado->currentPage(),
        ]);
    }
}
```

#### `AdminWebhookEventosController`

```php
// app/Http/Controllers/Admin/AdminWebhookEventosController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebhookEvento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWebhookEventosController extends Controller
{
    /**
     * GET /api/admin/webhook-eventos
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);

        $status = $request->query('status');
        $busca  = $request->query('q');
        $limite = 50;

        $query = WebhookEvento::orderBy('processado_em', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        if ($busca) {
            $query->where('email_comprador', 'LIKE', "%{$busca}%");
        }

        $paginado = $query->paginate($limite);

        return response()->json([
            'eventos' => $paginado->items(),
            'total'   => $paginado->total(),
            'paginas' => $paginado->lastPage(),
        ]);
    }
}
```

#### Adição ao `routes/api.php`

```php
// routes/api.php

// ── Webhook público (sem auth:sanctum — chamado pela Hotmart diretamente) ─
// A autenticação é feita internamente pelo controller via header token.
// Em Laravel 13, rotas /api já são excluídas do CSRF por padrão.
Route::post('/webhooks/hotmart', [WebhookHotmartController::class, 'receber'])
     ->middleware('throttle:60,1'); // Proteção mínima contra flood

// ── Painel admin ────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'assinante.ativo', 'role:admin'])
     ->prefix('admin')
     ->group(function () {
         Route::get('/assinantes',       [AdminAssinantesController::class, 'index']);
         Route::get('/webhook-eventos',  [AdminWebhookEventosController::class, 'index']);
     });
```

---

## 6. Endpoints da API

### `POST /api/webhooks/hotmart`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/webhooks/hotmart` |
| Middleware | `throttle:60,1` (público, sem `auth:sanctum`) |
| Header de segurança | `x-hotmart-webhook-token: {HOTMART_WEBHOOK_SECRET}` |

**Payload de exemplo — `PURCHASE_APPROVED`:**
```json
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "novocliente@email.com",
      "name": "João da Silva"
    },
    "product": { "id": "PROD_PRO_123" },
    "purchase": { "order_date": "2026-04-14T10:00:00Z" },
    "subscription": {
      "subscriber": { "code": "SUB_ABC123" }
    }
  }
}
```

**Response:** `OK` com HTTP 200 — sempre.

---

### `GET /api/admin/assinantes`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/admin/assinantes` |
| Middleware | `auth:sanctum`, `assinante.ativo`, `role:admin` |
| Params query | `status` (ativo\|cancelado\|reembolsado\|chargeback\|expirado), `plano`, `q`, `page` |

**Response 200:**
```json
{
  "assinantes": [
    {
      "id": 1,
      "user_id": 42,
      "plano": "pro",
      "ativo": true,
      "status": "ativo",
      "email": "cliente@empresa.com",
      "hotmart_subscription_id": "SUB_ABC123",
      "plano_iniciado_em": "2026-04-14T10:00:00Z",
      "user": { "id": 42, "name": "João da Silva", "email": "cliente@empresa.com" }
    }
  ],
  "total": 87,
  "paginas": 2,
  "pagina": 1
}
```

---

### `GET /api/admin/webhook-eventos`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/admin/webhook-eventos` |
| Middleware | `auth:sanctum`, `assinante.ativo`, `role:admin` |
| Params query | `status` (processado\|falhou\|ignorado), `q` (busca por e-mail), `page` |

**Response 200:**
```json
{
  "eventos": [
    {
      "id": 1,
      "tipo_evento": "PURCHASE_APPROVED",
      "email_comprador": "cliente@empresa.com",
      "nome_comprador": "João da Silva",
      "plano_detectado": "pro",
      "status": "processado",
      "mensagem_erro": null,
      "processado_em": "2026-04-14T10:00:05Z"
    }
  ],
  "total": 234,
  "paginas": 5
}
```

---

## 7. Templates de E-mail

### Configuração (`config/services.php` + `config/mail.php`)

```php
// config/services.php — adicionar:
'resend' => [
    'key' => env('RESEND_API_KEY'),
],
'hotmart' => [
    'webhook_secret'    => env('HOTMART_WEBHOOK_SECRET'),
    'produto_essencial' => env('HOTMART_PRODUTO_ESSENCIAL'),
    'produto_pro'       => env('HOTMART_PRODUTO_PRO'),
    'produto_reservado' => env('HOTMART_PRODUTO_RESERVADO'),
],
```

```php
// config/mail.php
'default' => env('MAIL_MAILER', 'resend'),
'mailers' => [
    'resend' => ['transport' => 'resend'],
],
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'noreply@geopoliticainvestidores.com.br'),
    'name'    => env('MAIL_FROM_NAME', 'Geopolítica para Investidores'),
],
```

---

### `BoasVindasMail`

```php
// app/Mail/BoasVindasMail.php
namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BoasVindasMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public readonly string $nome,
        public readonly string $plano,
        public readonly string $linkAcesso,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bem-vindo ao Geopolítica para Investidores'
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.boas-vindas');
    }
}
```

```blade
{{-- resources/views/emails/boas-vindas.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Bem-vindo</title></head>
<body style="background:#0a0a0b;font-family:Arial,sans-serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <p style="color:#C9B882;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">
      Geopolítica para Investidores
    </p>

    <h1 style="color:#F0ECE2;font-size:24px;font-weight:700;margin:0 0 16px;">
      Bem-vindo, {{ $nome }}.
    </h1>

    <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
      Sua assinatura do plano
      <strong style="color:#C9B882;">{{ ucfirst($plano) }}</strong>
      está ativa. Para definir sua senha e acessar o dashboard, clique no botão abaixo.
    </p>

    <hr style="border-color:#2a2a2a;margin:24px 0;">

    <div style="text-align:center;">
      <a href="{{ $linkAcesso }}"
         style="display:inline-block;background:#C9B882;color:#0a0a0b;
                font-size:11px;letter-spacing:0.1em;text-transform:uppercase;
                padding:14px 32px;text-decoration:none;font-weight:500;">
        Definir senha e acessar
      </a>
    </div>

    <hr style="border-color:#2a2a2a;margin:24px 0 16px;">

    <p style="color:#444;font-size:11px;">
      Este link expira em 60 minutos. Se você não realizou esta compra, ignore este e-mail.
    </p>

  </div>
</body>
</html>
```

---

### Demais Mails (estrutura resumida)

**`CancelamentoMail`** — construtor recebe: `nome`, `status` (cancelado|reembolsado|chargeback), `emailAssinante?`, `isNotificacaoAdmin?`  
**`MudancaPlanoMail`** — construtor recebe: `nome`, `planoAnterior`, `novoPlano`, `linkDashboard`  
**`RenovacaoLembreteMail`** — construtor recebe: `nome`, `plano`, `linkRenovacao`

Todos seguem o mesmo padrão visual (fundo `#0a0a0b`, dourado `#C9B882`, texto `#F0ECE2`).

---

## 8. Frontend React — Painel Admin

### 8.1 Estrutura de Arquivos

```
src/
├── pages/
│   └── admin/
│       ├── AdminAssinantes.tsx       ← lista de assinantes com filtros
│       └── AdminWebhookEventos.tsx   ← log de webhooks com payload expansível
├── components/
│   └── admin/
│       └── TabelaAdmin.tsx           ← tabela reutilizável paginada
└── hooks/
    ├── useAdminAssinantes.ts         ← React Query
    └── useAdminWebhookEventos.ts     ← React Query
```

### 8.2 `useAdminAssinantes`

```typescript
// src/hooks/useAdminAssinantes.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface FiltrosAssinantes {
  status?: string;
  plano?: string;
  q?: string;
  page?: number;
}

export function useAdminAssinantes(filtros: FiltrosAssinantes = {}) {
  return useQuery({
    queryKey: ['admin', 'assinantes', filtros],
    queryFn: () => api.get('/admin/assinantes', { params: filtros }).then(r => r.data),
    staleTime: 30_000, // 30 segundos — dados admin mudam com frequência
  });
}
```

### 8.3 `AdminAssinantes.tsx`

```tsx
// src/pages/admin/AdminAssinantes.tsx
import { useState } from 'react';
import { useAdminAssinantes } from '../../hooks/useAdminAssinantes';

const STATUS_OPCOES = [
  { value: 'ativo',       label: 'Ativo' },
  { value: 'cancelado',   label: 'Cancelado' },
  { value: 'reembolsado', label: 'Reembolsado' },
  { value: 'chargeback',  label: 'Chargeback' },
  { value: 'expirado',    label: 'Expirado' },
];

const PLANO_OPCOES = [
  { value: '',          label: 'Todos os planos' },
  { value: 'essencial', label: 'Essencial' },
  { value: 'pro',       label: 'Pro' },
  { value: 'reservado', label: 'Reservado' },
];

const CORES_STATUS: Record<string, string> = {
  ativo:       'text-green-400',
  cancelado:   'text-red-400',
  reembolsado: 'text-orange-400',
  chargeback:  'text-red-600',
  expirado:    'text-white/40',
};

export default function AdminAssinantes() {
  const [status, setStatus] = useState('ativo');
  const [plano,  setPlano]  = useState('');
  const [busca,  setBusca]  = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading } = useAdminAssinantes({
    status, plano: plano || undefined,
    q: busca || undefined, page: pagina,
  });

  function resetPagina() { setPagina(1); }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#f0ece2] font-serif text-xl font-bold">Assinantes</h1>
        <span className="text-white/30 text-xs">{data?.total ?? '—'} registros</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); resetPagina(); }}
          className="bg-[#111] border border-white/10 text-white/60 text-xs px-3 py-2"
        >
          {STATUS_OPCOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={plano}
          onChange={e => { setPlano(e.target.value); resetPagina(); }}
          className="bg-[#111] border border-white/10 text-white/60 text-xs px-3 py-2"
        >
          {PLANO_OPCOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input
          type="text" value={busca}
          onChange={e => { setBusca(e.target.value); resetPagina(); }}
          placeholder="Buscar por e-mail..."
          className="bg-[#111] border border-white/10 text-[#e8e4dc] text-xs px-3 py-2 flex-1 outline-none min-w-[200px]"
        />
      </div>

      {isLoading ? (
        <p className="text-white/30 text-sm">Carregando...</p>
      ) : (
        <>
          <div className="space-y-px">
            {/* Cabeçalho */}
            <div className="grid grid-cols-5 gap-4 text-[10px] tracking-wider uppercase
                            text-white/25 px-4 py-2">
              <span>E-mail</span><span>Nome</span><span>Plano</span>
              <span>Status</span><span>Início</span>
            </div>
            {(data?.assinantes ?? []).map((a: any) => (
              <div key={a.id}
                className="grid grid-cols-5 gap-4 border border-white/5 px-4 py-3
                           hover:border-white/10 transition-colors items-center">
                <span className="text-[#e8e4dc] text-sm truncate">{a.email}</span>
                <span className="text-white/50 text-xs">{a.user?.name}</span>
                <span className="text-[#c9b882] text-xs capitalize">{a.plano}</span>
                <span className={`text-xs ${CORES_STATUS[a.status] ?? 'text-white/40'}`}>
                  {a.status}
                </span>
                <span className="text-white/30 text-xs">
                  {a.plano_iniciado_em
                    ? new Date(a.plano_iniciado_em).toLocaleDateString('pt-BR')
                    : '—'}
                </span>
              </div>
            ))}
            {(data?.assinantes ?? []).length === 0 && (
              <p className="text-white/30 text-xs px-4 py-6">Nenhum resultado encontrado.</p>
            )}
          </div>

          {/* Paginação */}
          {(data?.paginas ?? 1) > 1 && (
            <div className="flex justify-center gap-1.5 mt-6">
              {Array.from({ length: data.paginas }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPagina(p)}
                  className={`text-xs px-3 py-1 border transition-colors
                    ${p === pagina
                      ? 'border-[#c9b882]/60 text-[#c9b882]'
                      : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### 8.4 `AdminWebhookEventos.tsx`

```tsx
// src/pages/admin/AdminWebhookEventos.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

const CORES_STATUS_WH: Record<string, string> = {
  processado: 'text-green-400 border-green-400/30',
  falhou:     'text-red-400 border-red-400/30',
  ignorado:   'text-white/30 border-white/20',
};

export default function AdminWebhookEventos() {
  const [status, setStatus] = useState('');
  const [busca,  setBusca]  = useState('');
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'webhook-eventos', { status, busca, pagina }],
    queryFn: () => api.get('/admin/webhook-eventos', {
      params: { status: status || undefined, q: busca || undefined, page: pagina }
    }).then(r => r.data),
    staleTime: 15_000,
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[#f0ece2] font-serif text-xl font-bold">Log de Webhooks</h1>
        <span className="text-white/30 text-xs">{data?.total ?? '—'} eventos</span>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={status} onChange={e => { setStatus(e.target.value); setPagina(1); }}
          className="bg-[#111] border border-white/10 text-white/60 text-xs px-3 py-2">
          <option value="">Todos os status</option>
          <option value="processado">Processado</option>
          <option value="falhou">Falhou</option>
          <option value="ignorado">Ignorado</option>
        </select>
        <input type="text" value={busca} placeholder="Buscar por e-mail..."
          onChange={e => { setBusca(e.target.value); setPagina(1); }}
          className="bg-[#111] border border-white/10 text-[#e8e4dc] text-xs px-3 py-2 flex-1 outline-none" />
      </div>

      {isLoading ? <p className="text-white/30 text-sm">Carregando...</p> : (
        <div className="space-y-px">
          {(data?.eventos ?? []).map((ev: any) => (
            <div key={ev.id}>
              <div
                className="flex items-center justify-between border border-white/5 px-4 py-3
                           hover:border-white/10 cursor-pointer transition-colors"
                onClick={() => setExpandido(expandido === ev.id ? null : ev.id)}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] border px-2 py-0.5 ${CORES_STATUS_WH[ev.status] ?? ''}`}>
                    {ev.status}
                  </span>
                  <span className="text-[#c9b882] text-xs font-mono">{ev.tipo_evento}</span>
                  <span className="text-white/50 text-xs">{ev.email_comprador}</span>
                </div>
                <span className="text-white/25 text-xs">
                  {new Date(ev.processado_em).toLocaleString('pt-BR')}
                </span>
              </div>
              {expandido === ev.id && (
                <div className="border border-white/5 border-t-0 px-4 py-3 bg-[#0d0d0f]">
                  {ev.mensagem_erro && (
                    <p className="text-red-400 text-xs mb-2 font-mono">{ev.mensagem_erro}</p>
                  )}
                  <pre className="text-white/30 text-[10px] font-mono overflow-x-auto max-h-48">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 9. Agendamentos (Laravel Scheduler)

Nenhum agendamento exclusivo deste módulo. O ciclo de vida das assinaturas é controlado inteiramente pelos webhooks em tempo real.

---

## 10. Jobs / Queues

Todos os e-mails transacionais são disparados em fila com `Mail::to()->queue()` para não bloquear o processamento do webhook.

```bash
# Configuração necessária
QUEUE_CONNECTION=redis

# Worker em produção (via Supervisor)
php artisan queue:work redis --tries=3 --backoff=30,120,300 --timeout=30
```

**Política de retentativas:** 3 tentativas com backoff de 30s, 2min e 5min entre elas. Após 3 falhas, o job vai para a `failed_jobs` table — monitorar via `php artisan queue:failed`.

---

## 11. Controle de Acesso

| Endpoint | Quem acessa |
|---|---|
| `POST /api/webhooks/hotmart` | Hotmart (sem Sanctum — validado por token no header) |
| `GET /api/admin/assinantes` | Somente role `admin` |
| `GET /api/admin/webhook-eventos` | Somente role `admin` |

---

## 12. Error Handling

| Situação | Comportamento |
|---|---|
| Token do webhook inválido | Registra aviso no Log, responde `200 OK` (não expõe a existência do endpoint) |
| E-mail do comprador vazio no payload | Evento registrado com `status = falhou`, `mensagem_erro` com detalhes |
| `handleCancelamento` para e-mail inexistente | Ignora silenciosamente (assinante pode ter sido criado manualmente e não ter o e-mail espelhado) |
| `SWITCH_PLAN` para e-mail inexistente | Trata como nova compra via `handleCompra()` |
| Falha no envio de e-mail | Job reenfileirado 3x; após falhar, vai para `failed_jobs` |
| Erro genérico no handler | `webhook_eventos.status = 'falhou'` com stack trace em `mensagem_erro` |
| Evento de tipo desconhecido | `webhook_eventos.status = 'ignorado'` (não é erro) |

**Regra de ouro:** O endpoint do webhook **sempre retorna HTTP 200**. Nunca retornar 4xx ou 5xx — a Hotmart faz retry em loop ao receber códigos de erro.

---

## 13. Configuração do Webhook na Hotmart

Após o deploy em produção:

1. Painel Hotmart → **Ferramentas → Webhooks** → **Adicionar Webhook**
2. **URL:** `https://seudominio.com.br/api/webhooks/hotmart`
3. **Token:** mesmo valor de `HOTMART_WEBHOOK_SECRET` no `.env`
4. **Eventos a selecionar:** `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_CANCELED`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_EXPIRED`, `SWITCH_PLAN`
5. Salvar e usar o botão **Testar** da Hotmart
6. Verificar em `webhook_eventos` se o teste chegou com `status = processado`

**Protocolo antes do go-live:**
1. Configurar webhook em staging
2. Testar cada tipo de evento com o botão "Testar" da Hotmart
3. Verificar criação de usuário + assinante + e-mail no `PURCHASE_APPROVED`
4. Verificar desativação do assinante no `PURCHASE_CANCELED`
5. Monitorar `webhook_eventos` nas primeiras 48h após go-live

---

## 14. Checklist de Entrega

### Banco de dados e configuração
- [ ] Migration `create_webhook_eventos_table` executada com todos os índices
- [ ] `HOTMART_WEBHOOK_SECRET` configurado no `.env` e no servidor de produção
- [ ] `HOTMART_PRODUTO_ESSENCIAL`, `_PRO`, `_RESERVADO` configurados no `.env`
- [ ] `RESEND_API_KEY` configurado (ou SMTP alternativo via `MAIL_*`)
- [ ] `config/mail.php` com driver correto (resend ou smtp)
- [ ] `config/services.php` com entradas `hotmart.*`
- [ ] `APP_FRONTEND_URL` configurado para geração do link de definição de senha
- [ ] `QUEUE_CONNECTION=redis` no `.env`
- [ ] Worker de filas configurado no Supervisor em produção

### Backend Laravel
- [ ] `WebhookHotmartController::receber` validando token corretamente
- [ ] Endpoint sempre retornando HTTP 200, mesmo em falha interna
- [ ] Todo evento registrado em `webhook_eventos` ANTES do processamento
- [ ] `handleCompra` criando `User` + `Assinante` + `syncRoles` + e-mail de boas-vindas
- [ ] `handleCompra` NÃO enviando e-mail de boas-vindas para re-compras
- [ ] `handleCancelamento` desativando assinante corretamente
- [ ] `handleChargeback` notificando admin, não o assinante
- [ ] `handleExpiracao` enviando lembrete de renovação
- [ ] `handleMudancaPlano` atualizando plano + role + e-mail
- [ ] `handleIgnorado` marcando evento como `ignorado` (não `falhou`)
- [ ] Erros capturados em try/catch e registrados em `mensagem_erro`
- [ ] Todos os e-mails enfileirados com `Mail::to()->queue()` (nunca `send()`)

### Templates de E-mail
- [ ] `BoasVindasMail` com link de definição de senha correto e funcional
- [ ] Token de reset com validade adequada (`config/auth.php` → `passwords.users.expire`)
- [ ] `CancelamentoMail` funcionando para `cancelado`, `reembolsado` e `chargeback`
- [ ] `MudancaPlanoMail` diferenciando upgrade de downgrade no texto
- [ ] `RenovacaoLembreteMail` com link direto para página de planos
- [ ] Todos os e-mails testados com Mailtrap ou similar em staging

### Frontend React — Painel Admin
- [ ] `/admin/assinantes` carregando com filtros de status e plano
- [ ] `/admin/webhook-eventos` exibindo log com payload expansível
- [ ] Busca por e-mail funcionando em ambas as páginas
- [ ] Paginação funcionando corretamente
- [ ] Cores distintas por status (ativo=verde, cancelado=vermelho, etc.)
- [ ] Rotas `/admin/assinantes` e `/admin/webhook-eventos` acessíveis apenas para role `admin`

### Testes
- [ ] Webhook configurado na Hotmart apontando para staging
- [ ] `PURCHASE_APPROVED` — user criado, assinante ativo, role correto, e-mail enviado
- [ ] `PURCHASE_CANCELED` — assinante desativado, e-mail de cancelamento enviado
- [ ] `SWITCH_PLAN` — plano e role atualizados, e-mail enviado
- [ ] `PURCHASE_CHARGEBACK` — assinante desativado, notificação para admin
- [ ] Todos os eventos aparecendo em `webhook_eventos` como `processado`
- [ ] Re-envio do mesmo evento (idempotência via `updateOrCreate`)
