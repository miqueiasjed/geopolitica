# PRD — Módulo 00: Autenticação e Onboarding
**Projeto:** Geopolítica para Investidores  
**Versão:** 1.0  
**Data:** Abril 2026  
**Depende de:** Nenhum (módulo base)  
**Prazo MVP:** 3 dias de desenvolvimento  
**Custo Estimado:** R$ 5.000 – R$ 10.000  
**Custo Mensal Adicional:** R$ 0

---

## 1. Visão Geral

O Módulo 00 é a fundação de toda a plataforma. Implementa o sistema completo de autenticação, controle de acesso por roles e o fluxo de onboarding do assinante.

**Premissas centrais do design:**

- **Sem cadastro público.** Nenhum usuário cria conta por conta própria. Toda conta é criada automaticamente pelo webhook do Hotmart (Módulo 10) quando uma compra é aprovada.
- **Primeiro acesso via link de definição de senha.** Quando o M10 cria a conta, dispara um e-mail com link de reset de senha (Laravel Password Reset). O assinante clica, define sua senha e acessa o dashboard.
- **Autenticação via Sanctum.** Tokens Bearer retornados no login, armazenados no frontend em `localStorage` (trade-off documentado abaixo).
- **Roles via Spatie Permission.** Quatro roles: `assinante_essencial`, `assinante_pro`, `assinante_reservado`, `admin`.
- **Assinante ativo.** Além do role, toda rota protegida verifica se `ativo = true` na tabela `assinantes`. Um assinante cancelado perde acesso imediato, mesmo com token válido.

**Trade-off: `localStorage` vs. cookie `httpOnly`**

O token Sanctum é armazenado em `localStorage` no frontend React SPA. Isso facilita o uso desacoplado (CORS simples com Bearer token), mas expõe o token a ataques XSS. A alternativa mais segura seria cookie `httpOnly` com `sanctum.stateful` + CSRF token, mas exige que frontend e backend compartilhem o mesmo domínio pai. Para este projeto, `localStorage` é aceitável dado que o frontend usa TypeScript estrito e não renderiza HTML não confiável. Documentar esse trade-off para revisão futura caso o produto escale para contexto de maior risco.

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend framework | Laravel 13 |
| Autenticação | Laravel Sanctum (token API) |
| Autorização | Spatie Laravel Permission |
| Banco de dados | MySQL 8.0 |
| Cache / sessões / filas | Redis |
| E-mail (reset de senha) | SMTP via `MAIL_*` no `.env` (Resend, SES ou Mailgun) |
| Frontend framework | React 19 + Vite + TypeScript |
| Estilo | TailwindCSS |
| Estado servidor | TanStack React Query v5 |
| Roteamento SPA | React Router v7 |
| Armazenamento do token | `localStorage` |

---

## 3. Dependências de Outros Módulos

| Módulo | Dependência |
|---|---|
| Módulo 10 (Hotmart) | Cria o usuário via `User::create()` + `assignRole()` e dispara o e-mail de definição de senha |
| Todos os outros módulos | Dependem do middleware `auth:sanctum` + `EnsureAssinanteAtivo` definidos aqui |

---

## 4. Prazo MVP e Custo Estimado

| Item | Detalhe |
|---|---|
| Prazo MVP | 3 dias |
| Custo desenvolvimento | R$ 5.000 – R$ 10.000 |
| Custo mensal adicional | R$ 0 |
| Dia 1 | Migrations, Models, Sanctum, Spatie, FormRequests, AuthController, SenhaController |
| Dia 2 | Middleware `EnsureAssinanteAtivo`, PerfilController, rotas, testes via Postman |
| Dia 3 | Frontend React: AuthContext, guard `RotaProtegida`, páginas Login/Reset/Perfil, roteamento |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   ├── AuthController.php          ← login, logout, me
│   │   │   └── SenhaController.php         ← esqueci/reset senha
│   │   └── PerfilController.php            ← ver e editar perfil
│   ├── Middleware/
│   │   └── EnsureAssinanteAtivo.php        ← verifica campo ativo na tabela assinantes
│   └── Requests/
│       ├── Auth/
│       │   ├── LoginRequest.php
│       │   ├── EsqueciSenhaRequest.php
│       │   └── ResetSenhaRequest.php
│       └── AtualizarPerfilRequest.php
├── Models/
│   ├── User.php                            ← HasRoles (Spatie), HasApiTokens (Sanctum)
│   └── Assinante.php                       ← status da assinatura, plano, vínculo com User
└── Services/
    ├── AuthService.php                     ← lógica de login, logout, geração de token
    └── PerfilService.php                   ← atualizar nome, e-mail, senha, preferências

routes/
└── api.php

database/
├── migrations/
│   ├── xxxx_add_campos_to_users_table.php
│   └── xxxx_create_assinantes_table.php
└── seeders/
    └── RolesSeeder.php

config/
├── sanctum.php
└── permission.php                          ← guard_name padrão: sanctum
```

---

### 5.2 Models e Migrations

#### Migration: adicionar campos à tabela `users` (padrão Laravel)

```php
// database/migrations/xxxx_add_campos_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->json('preferencias_notificacao')->nullable()->after('remember_token');
    $table->timestamp('ultimo_acesso_em')->nullable()->after('preferencias_notificacao');
});
```

#### Migration: `assinantes`

```php
// database/migrations/xxxx_create_assinantes_table.php
Schema::create('assinantes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')
          ->unique()
          ->constrained('users')
          ->cascadeOnDelete();
    $table->string('plano', 30)
          ->default('essencial')
          ->comment('essencial | pro | reservado');
    $table->boolean('ativo')->default(true)->index();
    $table->string('status', 30)
          ->default('ativo')
          ->comment('ativo | cancelado | reembolsado | chargeback | expirado');
    $table->string('hotmart_subscription_id')->nullable()->unique();
    $table->string('hotmart_product_id')->nullable();
    $table->string('email')->nullable()->index()
          ->comment('espelhado para busca rápida sem JOIN com users');
    $table->timestamp('plano_iniciado_em')->nullable();
    $table->timestamp('plano_expira_em')->nullable();
    $table->timestamps();

    $table->index(['ativo', 'plano']);
    $table->index(['status', 'ativo']);
});
```

**Schema completo da tabela `assinantes`:**

| Coluna | Tipo MySQL | Nullable | Default | Índice |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | NÃO | — | PRIMARY KEY |
| `user_id` | BIGINT UNSIGNED | NÃO | — | UNIQUE, FK → users.id |
| `plano` | VARCHAR(30) | NÃO | `'essencial'` | — |
| `ativo` | TINYINT(1) | NÃO | `1` | INDEX |
| `status` | VARCHAR(30) | NÃO | `'ativo'` | — |
| `hotmart_subscription_id` | VARCHAR(255) | SIM | NULL | UNIQUE |
| `hotmart_product_id` | VARCHAR(255) | SIM | NULL | — |
| `email` | VARCHAR(255) | SIM | NULL | INDEX |
| `plano_iniciado_em` | TIMESTAMP | SIM | NULL | — |
| `plano_expira_em` | TIMESTAMP | SIM | NULL | — |
| `created_at` | TIMESTAMP | SIM | NULL | — |
| `updated_at` | TIMESTAMP | SIM | NULL | — |

---

#### Model: `User`

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'preferencias_notificacao',
        'ultimo_acesso_em',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at'        => 'datetime',
        'preferencias_notificacao' => 'array',
        'ultimo_acesso_em'         => 'datetime',
        'password'                 => 'hashed',
    ];

    public function assinante(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Assinante::class);
    }

    public function planoAtual(): string
    {
        return $this->assinante?->plano ?? 'essencial';
    }

    public function assinanteAtivo(): bool
    {
        return $this->assinante?->ativo === true;
    }
}
```

#### Model: `Assinante`

```php
// app/Models/Assinante.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assinante extends Model
{
    protected $fillable = [
        'user_id', 'plano', 'ativo', 'status',
        'hotmart_subscription_id', 'hotmart_product_id',
        'email', 'plano_iniciado_em', 'plano_expira_em',
    ];

    protected $casts = [
        'ativo'             => 'boolean',
        'plano_iniciado_em' => 'datetime',
        'plano_expira_em'   => 'datetime',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

---

### 5.3 Services

#### `AuthService`

**Responsabilidades:**
- Validar credenciais e retornar token Sanctum via `createToken()`
- Revogar apenas o token atual no logout (não todos os tokens do usuário)
- Atualizar `ultimo_acesso_em` após login bem-sucedido
- Centralizar a formatação do payload de resposta (`usuario`, `token`, `plano`, `roles`)

```php
// app/Services/AuthService.php
namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(string $email, string $senha): array
    {
        if (!Auth::attempt(['email' => $email, 'password' => $senha])) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        /** @var User $usuario */
        $usuario = Auth::user();
        $usuario->update(['ultimo_acesso_em' => now()]);

        $token = $usuario->createToken('spa-token')->plainTextToken;

        return [
            'token'   => $token,
            'usuario' => $this->formatarUsuario($usuario),
        ];
    }

    public function logout(User $usuario): void
    {
        // Revoga apenas o token atual, não todos os tokens do usuário
        $usuario->currentAccessToken()->delete();
    }

    public function formatarUsuario(User $usuario): array
    {
        return [
            'id'                       => $usuario->id,
            'nome'                     => $usuario->name,
            'email'                    => $usuario->email,
            'plano'                    => $usuario->planoAtual(),
            'ativo'                    => $usuario->assinanteAtivo(),
            'roles'                    => $usuario->getRoleNames(),
            'preferencias_notificacao' => $usuario->preferencias_notificacao ?? [],
        ];
    }
}
```

#### `PerfilService`

**Responsabilidades:**
- Atualizar nome, e-mail e senha do usuário autenticado
- Atualizar preferências de notificação (merge parcial)
- Garantir unicidade do novo e-mail antes de persistir
- Retornar o modelo `User` atualizado com o relacionamento `assinante` carregado

```php
// app/Services/PerfilService.php
namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PerfilService
{
    public function atualizar(User $usuario, array $dados): User
    {
        $campos = [];

        if (isset($dados['nome'])) {
            $campos['name'] = $dados['nome'];
        }

        if (isset($dados['email']) && $dados['email'] !== $usuario->email) {
            $campos['email']             = $dados['email'];
            $campos['email_verified_at'] = null; // requer nova verificação
        }

        if (isset($dados['senha'])) {
            $campos['password'] = Hash::make($dados['senha']);
        }

        if (isset($dados['preferencias_notificacao'])) {
            // Merge com preferências existentes para não apagar campos não enviados
            $existentes = $usuario->preferencias_notificacao ?? [];
            $campos['preferencias_notificacao'] = array_merge(
                $existentes,
                $dados['preferencias_notificacao']
            );
        }

        if (!empty($campos)) {
            $usuario->update($campos);
        }

        return $usuario->fresh(['assinante']);
    }
}
```

---

### 5.4 FormRequests

```php
// app/Http/Requests/Auth/LoginRequest.php
namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'senha' => ['required', 'string', 'min:8'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'O e-mail é obrigatório.',
            'email.email'    => 'Informe um e-mail válido.',
            'senha.required' => 'A senha é obrigatória.',
            'senha.min'      => 'A senha deve ter pelo menos 8 caracteres.',
        ];
    }
}
```

```php
// app/Http/Requests/Auth/EsqueciSenhaRequest.php
public function authorize(): bool { return true; }

public function rules(): array
{
    return [
        'email' => ['required', 'email', 'exists:users,email'],
    ];
}

public function messages(): array
{
    return [
        'email.required' => 'O e-mail é obrigatório.',
        'email.email'    => 'Informe um e-mail válido.',
        'email.exists'   => 'Este e-mail não está cadastrado.',
    ];
}
```

```php
// app/Http/Requests/Auth/ResetSenhaRequest.php
public function authorize(): bool { return true; }

public function rules(): array
{
    return [
        'token'              => ['required', 'string'],
        'email'              => ['required', 'email'],
        'senha'              => ['required', 'string', 'min:8', 'confirmed'],
        'senha_confirmation' => ['required'],
    ];
}
```

```php
// app/Http/Requests/AtualizarPerfilRequest.php
public function authorize(): bool { return true; }

public function rules(): array
{
    return [
        'nome'        => ['sometimes', 'string', 'max:255'],
        'email'       => [
            'sometimes', 'email',
            'unique:users,email,' . $this->user()->id
        ],
        'senha_atual' => ['required_with:senha', 'string', 'current_password'],
        'senha'       => ['sometimes', 'string', 'min:8', 'confirmed'],
        'senha_confirmation' => ['required_with:senha'],
        'preferencias_notificacao'                 => ['sometimes', 'array'],
        'preferencias_notificacao.alertas_email'   => ['sometimes', 'boolean'],
        'preferencias_notificacao.resumo_semanal'  => ['sometimes', 'boolean'],
        'preferencias_notificacao.novos_briefings' => ['sometimes', 'boolean'],
    ];
}

public function messages(): array
{
    return [
        'email.unique'              => 'Este e-mail já está em uso por outra conta.',
        'senha_atual.current_password' => 'A senha atual informada está incorreta.',
        'senha.min'                 => 'A nova senha deve ter pelo menos 8 caracteres.',
        'senha.confirmed'           => 'A confirmação de senha não coincide.',
    ];
}
```

---

### 5.5 Controllers e Rotas

#### `AuthController`

```php
// app/Http/Controllers/Auth/AuthController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $resultado = $this->authService->login(
            $request->validated('email'),
            $request->validated('senha')
        );

        return response()->json($resultado, 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['mensagem' => 'Logout realizado com sucesso.'], 200);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(
            $this->authService->formatarUsuario(
                $request->user()->load('assinante')
            )
        );
    }
}
```

#### `SenhaController`

```php
// app/Http/Controllers/Auth/SenhaController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\EsqueciSenhaRequest;
use App\Http\Requests\Auth\ResetSenhaRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class SenhaController extends Controller
{
    public function esqueci(EsqueciSenhaRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json(
                ['mensagem' => 'Não foi possível enviar o link. Tente novamente.'],
                500
            );
        }

        return response()->json([
            'mensagem' => 'Link de redefinição enviado para o e-mail informado.'
        ]);
    }

    public function reset(ResetSenhaRequest $request): JsonResponse
    {
        // O facade Password::reset() espera os campos 'password' e 'password_confirmation'
        // Mapear campos do português para o que o Laravel espera internamente
        $request->merge([
            'password'              => $request->validated('senha'),
            'password_confirmation' => $request->validated('senha_confirmation'),
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($usuario, $senha) {
                $usuario->forceFill([
                    'password'       => Hash::make($senha),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($usuario));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['mensagem' => 'Token inválido ou expirado.'], 422);
        }

        return response()->json(['mensagem' => 'Senha redefinida com sucesso.']);
    }
}
```

#### `PerfilController`

```php
// app/Http/Controllers/PerfilController.php
namespace App\Http\Controllers;

use App\Http\Requests\AtualizarPerfilRequest;
use App\Services\AuthService;
use App\Services\PerfilService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerfilController extends Controller
{
    public function __construct(
        private readonly PerfilService $perfilService,
        private readonly AuthService   $authService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json(
            $this->authService->formatarUsuario(
                $request->user()->load('assinante')
            )
        );
    }

    public function update(AtualizarPerfilRequest $request): JsonResponse
    {
        $usuario = $this->perfilService->atualizar(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'mensagem' => 'Perfil atualizado com sucesso.',
            'usuario'  => $this->authService->formatarUsuario($usuario),
        ]);
    }
}
```

#### Middleware: `EnsureAssinanteAtivo`

```php
// app/Http/Middleware/EnsureAssinanteAtivo.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAssinanteAtivo
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json(['mensagem' => 'Não autenticado.'], 401);
        }

        $assinante = $usuario->assinante;

        if (!$assinante || !$assinante->ativo) {
            return response()->json([
                'mensagem' => 'Sua assinatura está inativa. Entre em contato com o suporte.',
                'codigo'   => 'assinatura_inativa',
            ], 403);
        }

        return $next($request);
    }
}
```

**Registrar em `bootstrap/app.php`:**

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'assinante.ativo' => \App\Http\Middleware\EnsureAssinanteAtivo::class,
    ]);
})
```

#### `routes/api.php`

```php
<?php
// routes/api.php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SenhaController;
use App\Http\Controllers\PerfilController;
use Illuminate\Support\Facades\Route;

// ── Rotas públicas (sem autenticação) ──────────────────────────────────────
Route::prefix('auth')->group(function () {
    // Rate limit: máx 5 tentativas de login por minuto por IP
    Route::post('/login',         [AuthController::class, 'login'])
         ->middleware('throttle:5,1');
    Route::post('/esqueci-senha', [SenhaController::class, 'esqueci']);
    Route::post('/reset-senha',   [SenhaController::class, 'reset']);
});

// ── Rotas autenticadas ─────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'assinante.ativo'])->group(function () {

    // Autenticação
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Perfil do usuário
    Route::get('/perfil', [PerfilController::class, 'show']);
    Route::put('/perfil', [PerfilController::class, 'update']);
});
```

---

## 6. Endpoints da API

### `POST /api/auth/login`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/auth/login` |
| Middleware | `throttle:5,1` (público) |
| Content-Type | `application/json` |

**Body:**
```json
{
  "email": "investidor@empresa.com",
  "senha": "MinhaS3nh@"
}
```

**Response 200:**
```json
{
  "token": "1|aBcDeF1234567890plainTextToken",
  "usuario": {
    "id": 42,
    "nome": "Carlos Silva",
    "email": "investidor@empresa.com",
    "plano": "pro",
    "ativo": true,
    "roles": ["assinante_pro"],
    "preferencias_notificacao": {
      "alertas_email": true,
      "resumo_semanal": false,
      "novos_briefings": true
    }
  }
}
```

**Response 422:**
```json
{
  "mensagem": "Dados inválidos.",
  "errors": { "email": ["Credenciais inválidas."] }
}
```

**Response 429:**
```json
{ "mensagem": "Too Many Attempts." }
```

---

### `POST /api/auth/logout`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/auth/logout` |
| Middleware | `auth:sanctum`, `assinante.ativo` |
| Header | `Authorization: Bearer {token}` |

**Response 200:**
```json
{ "mensagem": "Logout realizado com sucesso." }
```

---

### `GET /api/auth/me`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/auth/me` |
| Middleware | `auth:sanctum`, `assinante.ativo` |

**Response 200:** Payload completo do usuário (mesmo objeto `usuario` do login).

---

### `POST /api/auth/esqueci-senha`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/auth/esqueci-senha` |
| Middleware | Nenhum (público) |

**Body:**
```json
{ "email": "investidor@empresa.com" }
```

**Response 200:**
```json
{ "mensagem": "Link de redefinição enviado para o e-mail informado." }
```

**Response 422:** Se e-mail não existe na base.

---

### `POST /api/auth/reset-senha`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/auth/reset-senha` |
| Middleware | Nenhum (público) |

**Body:**
```json
{
  "token": "abc123tokenGeradoPeloLaravel",
  "email": "investidor@empresa.com",
  "senha": "NovaSenha@123",
  "senha_confirmation": "NovaSenha@123"
}
```

**Response 200:**
```json
{ "mensagem": "Senha redefinida com sucesso." }
```

**Response 422:**
```json
{ "mensagem": "Token inválido ou expirado." }
```

---

### `GET /api/perfil`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/perfil` |
| Middleware | `auth:sanctum`, `assinante.ativo` |

**Response 200:** Payload completo do usuário.

---

### `PUT /api/perfil`

| Campo | Detalhe |
|---|---|
| Método | PUT |
| Path | `/api/perfil` |
| Middleware | `auth:sanctum`, `assinante.ativo` |

**Body (todos os campos são opcionais — enviar apenas o que mudar):**
```json
{
  "nome": "Carlos Silva Jr.",
  "email": "novo@empresa.com",
  "senha_atual": "SenhaAnterior@1",
  "senha": "NovaSenha@456",
  "senha_confirmation": "NovaSenha@456",
  "preferencias_notificacao": {
    "alertas_email": true,
    "resumo_semanal": true,
    "novos_briefings": false
  }
}
```

**Response 200:**
```json
{
  "mensagem": "Perfil atualizado com sucesso.",
  "usuario": { "...payload completo do usuário..." }
}
```

---

## 7. Frontend React

### 7.1 Estrutura de Arquivos

```
src/
├── pages/
│   ├── Login.tsx                ← formulário de login
│   ├── EsqueciSenha.tsx         ← formulário de e-mail para reset
│   ├── RedefinirSenha.tsx       ← formulário de nova senha (token na URL)
│   └── Perfil.tsx               ← editar nome, e-mail, senha, preferências
├── components/
│   ├── auth/
│   │   └── RotaProtegida.tsx    ← guard: redireciona para /login se não autenticado
│   └── layout/
│       └── LayoutDashboard.tsx  ← layout principal das rotas autenticadas
├── hooks/
│   ├── useAuth.ts               ← consome o AuthContext
│   └── usePerfil.ts             ← React Query: buscar e atualizar perfil
├── services/
│   └── api.ts                   ← instância axios com interceptors (token + 401)
└── contexts/
    └── AuthContext.tsx           ← provider do estado de autenticação global
```

---

### 7.2 Componentes e Hooks Principais

#### `AuthContext`

```tsx
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  plano: 'essencial' | 'pro' | 'reservado';
  ativo: boolean;
  roles: string[];
  preferencias_notificacao: Record<string, boolean>;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  autenticado: boolean;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario]       = useState<Usuario | null>(null);
  const [token, setToken]           = useState<string | null>(localStorage.getItem('token'));
  const [carregando, setCarregando] = useState(true);

  // Na montagem, se há token salvo, busca o usuário para verificar validade
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setUsuario(res.data))
        .catch(() => {
          // Token inválido ou expirado: limpar estado
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
  }, []);

  async function login(email: string, senha: string) {
    const res = await api.post('/auth/login', { email, senha });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUsuario(res.data.usuario);
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  }

  function atualizarUsuario(dados: Partial<Usuario>) {
    setUsuario(prev => prev ? { ...prev, ...dados } : prev);
  }

  return (
    <AuthContext.Provider value={{
      usuario, token,
      autenticado: !!usuario,
      carregando,
      login, logout, atualizarUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### `api.ts` — Axios com interceptors

```typescript
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Injeta token Bearer em toda requisição
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para /login em 401 (token expirado ou revogado)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

#### `RotaProtegida`

```tsx
// src/components/auth/RotaProtegida.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function RotaProtegida() {
  const { autenticado, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <span className="text-[#c9b882]/40 text-sm tracking-wider">Carregando...</span>
      </div>
    );
  }

  return autenticado ? <Outlet /> : <Navigate to="/login" replace />;
}
```

#### `usePerfil` — React Query

```typescript
// src/hooks/usePerfil.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function usePerfil() {
  const { atualizarUsuario } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['perfil'],
    queryFn: () => api.get('/perfil').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const mutation = useMutation({
    mutationFn: (dados: Record<string, unknown>) =>
      api.put('/perfil', dados).then(res => res.data),
    onSuccess: data => {
      atualizarUsuario(data.usuario);
      queryClient.setQueryData(['perfil'], data.usuario);
    },
  });

  return {
    ...query,
    atualizarPerfil: mutation.mutate,
    salvando: mutation.isPending,
    erroSalvar: mutation.error,
  };
}
```

---

### 7.3 Fluxo de Dados

```
Montagem do App
    └── AuthProvider.useEffect()
            ├── token no localStorage? → GET /api/auth/me
            │       ├── 200: setUsuario() → autenticado = true
            │       └── 401: clear localStorage → autenticado = false
            └── sem token → setCarregando(false) → autenticado = false

Login
    └── AuthProvider.login()
            └── POST /api/auth/login
                    └── 200: setToken() + setUsuario() → navigate('/dashboard')

Logout
    └── AuthProvider.logout()
            ├── POST /api/auth/logout (revoga token no servidor)
            └── clear localStorage → setUsuario(null) → navigate('/login')

Rota protegida acessada sem autenticação
    └── RotaProtegida
            └── autenticado = false → <Navigate to="/login" replace />

Qualquer requisição recebe 401
    └── api.interceptors.response
            └── localStorage.removeItem('token') → window.location = '/login'
```

---

### 7.4 Página `Login.tsx` (referência de implementação)

```tsx
// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [erro, setErro]         = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.email?.[0] ??
        err.response?.data?.mensagem ??
        'Erro ao fazer login. Tente novamente.';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-[#c9b882] text-xs tracking-[0.3em] uppercase mb-8 text-center">
          Geopolítica para Investidores
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/40 text-xs tracking-wider uppercase block mb-1.5">
              E-mail
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[#111] border border-white/10 text-[#e8e4dc]
                         text-sm px-4 py-3 focus:border-[#c9b882]/40 outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs tracking-wider uppercase block mb-1.5">
              Senha
            </label>
            <input
              type="password" value={senha}
              onChange={e => setSenha(e.target.value)} required
              className="w-full bg-[#111] border border-white/10 text-[#e8e4dc]
                         text-sm px-4 py-3 focus:border-[#c9b882]/40 outline-none"
            />
          </div>
          {erro && <p className="text-red-400 text-xs">{erro}</p>}
          <button
            type="submit" disabled={carregando}
            className="w-full bg-[#c9b882] text-[#0a0a0b] text-xs tracking-wider
                       uppercase py-3 font-medium hover:bg-[#d9ca99]
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/esqueci-senha"
            className="text-white/30 text-xs hover:text-white/50 transition-colors">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </div>
  );
}
```

> **Nota sobre `RedefinirSenha.tsx`:** A página deve ler `token` e `email` via `useSearchParams()` do React Router. O link enviado por e-mail pelo Laravel segue o formato configurado em `config/auth.php` → `passwords.users.url`, que deve apontar para `{FRONTEND_URL}/redefinir-senha`. Configurar a variável `FRONTEND_URL` no `.env` do Laravel.

---

### 7.5 Roteamento completo (`App.tsx`)

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { RotaProtegida } from './components/auth/RotaProtegida';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login"            element={<Login />} />
            <Route path="/esqueci-senha"    element={<EsqueciSenha />} />
            <Route path="/redefinir-senha"  element={<RedefinirSenha />} />

            {/* Rotas protegidas */}
            <Route element={<RotaProtegida />}>
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/perfil"      element={<Perfil />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## 8. Agendamentos (Laravel Scheduler)

Nenhum agendamento exclusivo deste módulo. O M10 (Hotmart) trata expiração de assinaturas via webhooks.

---

## 9. Jobs / Queues

O envio de e-mails de reset de senha usa a fila padrão do Laravel. Garantir:
- `QUEUE_CONNECTION=redis` no `.env`
- Worker em produção: `php artisan queue:work redis --tries=3 --timeout=30`
- Supervisor (ou similar) para manter o worker vivo em produção

---

## 10. Controle de Acesso

| Role | Permissões neste módulo |
|---|---|
| `assinante_essencial` | Login, logout, ver/editar próprio perfil, reset de senha |
| `assinante_pro` | Idem |
| `assinante_reservado` | Idem |
| `admin` | Idem + pode criar usuários diretamente pelo painel admin |

**Seeder de roles (`database/seeders/RolesSeeder.php`):**

```php
use Spatie\Permission\Models\Role;

// ATENÇÃO: guard_name deve ser 'sanctum', não 'web'
Role::firstOrCreate(['name' => 'assinante_essencial', 'guard_name' => 'sanctum']);
Role::firstOrCreate(['name' => 'assinante_pro',       'guard_name' => 'sanctum']);
Role::firstOrCreate(['name' => 'assinante_reservado', 'guard_name' => 'sanctum']);
Role::firstOrCreate(['name' => 'admin',               'guard_name' => 'sanctum']);
```

**Configuração crítica em `config/permission.php`:**

```php
'defaults' => [
    'guard_name' => 'sanctum',
],
```

---

## 11. Error Handling

| Código HTTP | Situação | Mensagem padrão |
|---|---|---|
| 400 | Body inválido / JSON malformado | `"Requisição inválida."` |
| 401 | Token ausente, inválido ou revogado | `"Não autenticado."` |
| 403 | Assinatura inativa | `"Sua assinatura está inativa."` + `"codigo": "assinatura_inativa"` |
| 403 | Role insuficiente | `"Acesso não autorizado para este recurso."` |
| 422 | Falha de validação (FormRequest) | Objeto `errors` com campos e mensagens em português |
| 429 | Rate limit no login | `"Muitas tentativas. Aguarde antes de tentar novamente."` |
| 500 | Erro interno não tratado | `"Erro interno do servidor. Tente novamente."` |

**Handler global em `bootstrap/app.php`:**

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
        if ($request->expectsJson()) {
            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json(['mensagem' => 'Não autenticado.'], 401);
            }
            if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                return response()->json(['mensagem' => 'Acesso não autorizado.'], 403);
            }
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'mensagem' => 'Dados inválidos.',
                    'errors'   => $e->errors(),
                ], 422);
            }
        }
        return null; // fallback para handler padrão do Laravel
    });
})
```

---

## 12. Checklist de Entrega

### Banco de dados e configuração base
- [ ] `php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"` executado
- [ ] Migration das tabelas do Spatie executada
- [ ] Migration `add_campos_to_users_table` executada (`preferencias_notificacao`, `ultimo_acesso_em`)
- [ ] Migration `create_assinantes_table` executada com todos os índices corretos
- [ ] `RolesSeeder` executado — 4 roles com `guard_name = 'sanctum'`
- [ ] `config/permission.php` com `default guard_name = sanctum`
- [ ] `php artisan sanctum:install` executado e migration do Sanctum executada

### Backend Laravel
- [ ] Guard `sanctum` configurado em `config/auth.php`
- [ ] `EnsureAssinanteAtivo` registrado como alias em `bootstrap/app.php`
- [ ] Handler global de exceções retornando JSON para rotas da API
- [ ] `AuthController::login` validando credenciais, retornando token + dados
- [ ] `AuthController::logout` revogando apenas o token atual
- [ ] `AuthController::me` retornando payload completo do usuário
- [ ] `SenhaController::esqueci` enviando e-mail via `Password::sendResetLink()`
- [ ] `SenhaController::reset` redefinindo senha e disparando `PasswordReset`
- [ ] `PerfilController::show` retornando perfil completo com relacionamentos
- [ ] `PerfilController::update` atualizando campos parcialmente (only validated)
- [ ] `AuthService` e `PerfilService` isolados com responsabilidades claras
- [ ] Todos os `FormRequests` com mensagens de erro em português
- [ ] Rate limiting `throttle:5,1` ativo no endpoint de login
- [ ] `FRONTEND_URL` configurado no `.env` para links de reset de senha
- [ ] CORS configurado (`config/cors.php`) para aceitar origin do frontend

### Frontend React
- [ ] `AuthContext` com estado global de autenticação
- [ ] Token salvo em `localStorage` e injetado via interceptor Axios em toda requisição
- [ ] `RotaProtegida` redirecionando para `/login` se não autenticado
- [ ] Tela de loading exibida durante verificação do token inicial
- [ ] Página `Login` com feedback de erro de credenciais
- [ ] Página `EsqueciSenha` com feedback de sucesso no envio do e-mail
- [ ] Página `RedefinirSenha` lendo `token` e `email` via `useSearchParams()`
- [ ] Página `Perfil` usando React Query com atualização otimista
- [ ] Interceptor de 401 limpando `localStorage` e redirecionando para `/login`
- [ ] `VITE_API_URL` configurado no `.env` do frontend
- [ ] Trade-off `localStorage` vs. `httpOnly cookie` documentado nos comentários do código
