# PRD — Módulo 11: Licenciamento B2B
**Projeto:** Geopolítica para Investidores  
**Versão:** 2.0 (Stack Laravel + React)  
**Data:** Abril 2026  
**Depende de:** Módulos 00 a 09 concluídos em produção  
**Prazo MVP:** 6 dias de desenvolvimento  
**Custo Estimado:** R$ 18.000 – R$ 40.000  
**Ticket B2B Sugerido:** R$ 15.000 – R$ 50.000/ano por licença

---

## 1. Visão Geral

O Módulo 11 transforma o produto num negócio B2B de alto ticket — gestoras de investimentos, family offices, consultorias estratégicas e departamentos de inteligência corporativa pagam entre R$ 15.000 e R$ 50.000 por ano por uma licença que permite múltiplos usuários com permissões distintas, URL própria e identidade visual customizada.

**Modelo de negócio:** Uma licença B2B de R$ 30.000/ano equivale a mais de 100 assinaturas do plano Essencial. O custo marginal de atender uma empresa é próximo de zero — o conteúdo já existe.

**O que cada empresa licenciada recebe:**

| Aspecto | Especificação |
|---|---|
| URL de acesso | `subdominio.geopoliticainvestidores.com.br` |
| Customização visual | Logo da empresa + nome da empresa na nav |
| Usuários | Configurável por contrato — típico: 5 a 20 usuários |
| Roles internos | `company_admin` (gerencia equipe) e `reader` (acessa dashboard) |
| Conteúdo | Idêntico ao plano Reservado — todos os módulos 01 a 09 |
| Chat M09 | 50 perguntas/dia por usuário da licença |
| Gestão de equipe | Self-service pelo `company_admin` via painel dedicado |
| Gestão da licença | Criação e configuração pelo admin do canal via painel admin |

**Estratégia multi-tenant:** Single database, shared schema com `empresa_id` nas tabelas relevantes. Sem banco separado por cliente — simplifica o MVP e escala facilmente até centenas de empresas. O subdomínio identifica o tenant via middleware Laravel.

**Pré-requisitos de infraestrutura:**
- Wildcard DNS: `*.geopoliticainvestidores.com.br` → IP do servidor
- Wildcard SSL: certificado Let's Encrypt ou similar para `*.dominio.com.br`
- Nginx configurado para aceitar todos os subdomínios na mesma aplicação Laravel

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend framework | Laravel 13 |
| Autenticação | Laravel Sanctum |
| Autorização | Spatie Laravel Permission |
| Multi-tenant | Middleware de resolução por subdomínio + `empresa_id` nas queries |
| Banco de dados | MySQL 8.0 |
| Cache / filas | Redis |
| E-mail (convites) | Resend via `resend/resend-laravel` + Blade |
| Frontend framework | React 19 + Vite + TypeScript |
| Estilo | TailwindCSS + CSS Custom Properties para tema |
| Estado servidor | TanStack React Query v5 |
| Roteamento SPA | React Router v7 |

---

## 3. Dependências de Outros Módulos

| Módulo | Dependência |
|---|---|
| M00 | Tabelas `users` e `assinantes`, `auth:sanctum`, `EnsureAssinanteAtivo`, roles Spatie |
| M01–M09 | Todo o conteúdo do dashboard deve ser acessível via subdomínio B2B |

---

## 4. Prazo MVP e Custo Estimado

| Item | Detalhe |
|---|---|
| Prazo MVP | 6 dias |
| Custo desenvolvimento | R$ 18.000 – R$ 40.000 |
| Custo mensal adicional | R$ 0 |
| Dia 1 | Wildcard DNS/SSL, migrations, Models, Seeder de roles B2B, `IdentificarTenantMiddleware` |
| Dia 2 | `LicencaB2BService`, `MembroB2BService`, controllers de empresa/membros |
| Dia 3 | Fluxo de convite completo (envio → token → aceite → conta criada) |
| Dia 4 | Frontend: painel de equipe (`TeamPanel`, `MembersList`, `InviteMemberModal`) |
| Dia 5 | Painel admin do canal (`/admin/b2b`) — CRUD de licenças |
| Dia 6 | Testes end-to-end + Scheduler de expiração + ajustes finais |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── B2B/
│   │   │   ├── B2BEmpresaController.php        ← dados da empresa pelo slug
│   │   │   ├── B2BMembroController.php         ← GET lista + POST convidar + PATCH/DELETE
│   │   │   └── B2BConviteController.php        ← GET validar + POST aceitar convite
│   │   └── Admin/
│   │       └── AdminLicencasB2BController.php  ← CRUD de licenças (admin canal)
│   ├── Middleware/
│   │   └── IdentificarTenantB2B.php            ← resolve empresa pelo subdomínio
│   └── Requests/
│       ├── B2B/
│       │   ├── ConvidarMembroRequest.php
│       │   └── AceitarConviteRequest.php
│       └── Admin/
│           └── SalvarLicencaB2BRequest.php
├── Models/
│   ├── LicencaB2B.php
│   ├── MembroB2B.php
│   └── ConviteB2B.php
└── Services/
    ├── LicencaB2BService.php        ← criar, suspender, renovar licença
    └── MembroB2BService.php         ← convidar, aceitar, remover, alterar role

routes/
└── api.php

database/
└── migrations/
    ├── xxxx_create_licencas_b2b_table.php
    ├── xxxx_create_membros_b2b_table.php
    └── xxxx_create_convites_b2b_table.php

resources/
└── views/
    └── emails/
        └── b2b-convite.blade.php

config/
└── b2b.php                          ← domínio base configurável
```

---

### 5.2 Models e Migrations

#### Migration: `licencas_b2b`

Uma licença por empresa. Gerenciada pelo admin do canal.

```php
// database/migrations/xxxx_create_licencas_b2b_table.php
Schema::create('licencas_b2b', function (Blueprint $table) {
    $table->id();
    $table->string('nome_empresa')
          ->comment('Nome completo da empresa licenciada');
    $table->string('slug_empresa')
          ->unique()
          ->comment('ex: "blackrock-brasil" → blackrock-brasil.dominio.com.br');
    $table->string('logo_url')->nullable()
          ->comment('URL do logotipo da empresa (CDN ou storage público)');
    $table->unsignedSmallInteger('max_usuarios')
          ->default(10)
          ->comment('Máximo de usuários ativos permitidos pela licença');
    $table->string('status', 20)
          ->default('ativa')
          ->comment('ativa | suspensa | expirada');
    $table->string('plano', 30)->default('pro')
          ->comment('Plano base dos usuários — tipicamente pro ou reservado');
    $table->decimal('valor_contrato', 10, 2)->nullable()
          ->comment('Valor anual do contrato em R$ — apenas controle interno');
    $table->date('contrato_inicio');
    $table->date('contrato_fim');
    $table->string('email_faturamento')
          ->comment('E-mail de contato para renovação e notificações de expiração');
    $table->text('notas_internas')->nullable()
          ->comment('Notas privadas do admin do canal — não visíveis à empresa');
    $table->timestamps();

    $table->index('slug_empresa');
    $table->index(['status', 'contrato_fim']);
});
```

**Schema completo da tabela `licencas_b2b`:**

| Coluna | Tipo MySQL | Nullable | Default | Índice |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | NÃO | — | PRIMARY KEY |
| `nome_empresa` | VARCHAR(255) | NÃO | — | — |
| `slug_empresa` | VARCHAR(255) | NÃO | — | UNIQUE |
| `logo_url` | VARCHAR(255) | SIM | NULL | — |
| `max_usuarios` | SMALLINT UNSIGNED | NÃO | `10` | — |
| `status` | VARCHAR(20) | NÃO | `'ativa'` | INDEX com contrato_fim |
| `plano` | VARCHAR(30) | NÃO | `'pro'` | — |
| `valor_contrato` | DECIMAL(10,2) | SIM | NULL | — |
| `contrato_inicio` | DATE | NÃO | — | — |
| `contrato_fim` | DATE | NÃO | — | INDEX com status |
| `email_faturamento` | VARCHAR(255) | NÃO | — | — |
| `notas_internas` | TEXT | SIM | NULL | — |
| `created_at` | TIMESTAMP | SIM | NULL | — |
| `updated_at` | TIMESTAMP | SIM | NULL | — |

---

#### Migration: `membros_b2b`

Membros ativos de cada licença. Gerenciados pelo `company_admin` em self-service.

```php
// database/migrations/xxxx_create_membros_b2b_table.php
Schema::create('membros_b2b', function (Blueprint $table) {
    $table->id();
    $table->foreignId('licenca_id')
          ->constrained('licencas_b2b')
          ->cascadeOnDelete();
    $table->foreignId('user_id')
          ->constrained('users')
          ->cascadeOnDelete();
    $table->string('email')
          ->comment('E-mail espelhado para busca rápida');
    $table->string('role', 30)
          ->default('reader')
          ->comment('company_admin | reader');
    $table->string('status', 20)
          ->default('ativo')
          ->comment('ativo | convidado | suspenso');
    $table->foreignId('convidado_por')
          ->nullable()
          ->constrained('users')
          ->nullOnDelete();
    $table->timestamp('convidado_em')->nullable();
    $table->timestamp('entrou_em')->nullable();
    $table->timestamps();

    $table->unique(['licenca_id', 'email']);
    $table->index(['licenca_id', 'status']);
    $table->index('user_id');
});
```

**Schema completo da tabela `membros_b2b`:**

| Coluna | Tipo MySQL | Nullable | Default | Índice |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | NÃO | — | PRIMARY KEY |
| `licenca_id` | BIGINT UNSIGNED | NÃO | — | FK → licencas_b2b.id |
| `user_id` | BIGINT UNSIGNED | NÃO | — | FK → users.id |
| `email` | VARCHAR(255) | NÃO | — | UNIQUE com licenca_id |
| `role` | VARCHAR(30) | NÃO | `'reader'` | — |
| `status` | VARCHAR(20) | NÃO | `'ativo'` | INDEX com licenca_id |
| `convidado_por` | BIGINT UNSIGNED | SIM | NULL | FK → users.id |
| `convidado_em` | TIMESTAMP | SIM | NULL | — |
| `entrou_em` | TIMESTAMP | SIM | NULL | — |
| `created_at` | TIMESTAMP | SIM | NULL | — |
| `updated_at` | TIMESTAMP | SIM | NULL | — |

---

#### Migration: `convites_b2b`

Convites pendentes — usuários convidados que ainda não aceitaram.

```php
// database/migrations/xxxx_create_convites_b2b_table.php
Schema::create('convites_b2b', function (Blueprint $table) {
    $table->id();
    $table->foreignId('licenca_id')
          ->constrained('licencas_b2b')
          ->cascadeOnDelete();
    $table->string('email');
    $table->string('role', 30)->default('reader');
    $table->string('token')->unique()
          ->comment('Token UUID para aceitar o convite via URL');
    $table->foreignId('convidado_por')
          ->nullable()
          ->constrained('users')
          ->nullOnDelete();
    $table->timestamp('expira_em')
          ->comment('7 dias a partir da criação');
    $table->timestamp('aceito_em')->nullable();
    $table->timestamps();

    $table->index('token');
    $table->index(['licenca_id', 'email']);
});
```

**Schema completo da tabela `convites_b2b`:**

| Coluna | Tipo MySQL | Nullable | Default | Índice |
|---|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | NÃO | — | PRIMARY KEY |
| `licenca_id` | BIGINT UNSIGNED | NÃO | — | FK → licencas_b2b.id |
| `email` | VARCHAR(255) | NÃO | — | INDEX com licenca_id |
| `role` | VARCHAR(30) | NÃO | `'reader'` | — |
| `token` | VARCHAR(255) | NÃO | — | UNIQUE |
| `convidado_por` | BIGINT UNSIGNED | SIM | NULL | FK → users.id |
| `expira_em` | TIMESTAMP | NÃO | — | — |
| `aceito_em` | TIMESTAMP | SIM | NULL | — |
| `created_at` | TIMESTAMP | SIM | NULL | — |
| `updated_at` | TIMESTAMP | SIM | NULL | — |

---

#### Models

```php
// app/Models/LicencaB2B.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LicencaB2B extends Model
{
    protected $table = 'licencas_b2b';

    protected $fillable = [
        'nome_empresa', 'slug_empresa', 'logo_url', 'max_usuarios',
        'status', 'plano', 'valor_contrato', 'contrato_inicio',
        'contrato_fim', 'email_faturamento', 'notas_internas',
    ];

    protected $casts = [
        'contrato_inicio' => 'date',
        'contrato_fim'    => 'date',
        'valor_contrato'  => 'decimal:2',
    ];

    public function membros(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(MembroB2B::class, 'licenca_id');
    }

    public function convites(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ConviteB2B::class, 'licenca_id');
    }

    public function ativa(): bool
    {
        return $this->status === 'ativa'
            && $this->contrato_fim >= now()->toDateString();
    }

    public function vagasDisponiveis(): int
    {
        $ativos   = $this->membros()->where('status', 'ativo')->count();
        $pendentes = $this->convites()
            ->whereNull('aceito_em')
            ->where('expira_em', '>', now())
            ->count();

        return max(0, $this->max_usuarios - $ativos - $pendentes);
    }
}
```

```php
// app/Models/MembroB2B.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembroB2B extends Model
{
    protected $table = 'membros_b2b';

    protected $fillable = [
        'licenca_id', 'user_id', 'email', 'role', 'status',
        'convidado_por', 'convidado_em', 'entrou_em',
    ];

    protected $casts = [
        'convidado_em' => 'datetime',
        'entrou_em'    => 'datetime',
    ];

    public function licenca(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(LicencaB2B::class, 'licenca_id');
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

```php
// app/Models/ConviteB2B.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConviteB2B extends Model
{
    protected $table = 'convites_b2b';

    protected $fillable = [
        'licenca_id', 'email', 'role', 'token',
        'convidado_por', 'expira_em', 'aceito_em',
    ];

    protected $casts = [
        'expira_em' => 'datetime',
        'aceito_em' => 'datetime',
    ];

    public function licenca(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(LicencaB2B::class, 'licenca_id');
    }

    public function valido(): bool
    {
        return is_null($this->aceito_em) && $this->expira_em->isFuture();
    }
}
```

---

### 5.3 Middleware: `IdentificarTenantB2B`

```php
// app/Http/Middleware/IdentificarTenantB2B.php
namespace App\Http\Middleware;

use App\Models\LicencaB2B;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentificarTenantB2B
{
    public function handle(Request $request, Closure $next): Response
    {
        $host        = $request->getHost();
        $dominioBase = config('b2b.dominio_base', 'geopoliticainvestidores.com.br');

        // Extrair subdomínio — remover o domínio base
        $subdominio = str_replace(".{$dominioBase}", '', $host);

        // Se não há subdomínio distinto, continuar sem tenant (acesso direto à API)
        if ($subdominio === $host || in_array($subdominio, ['api', 'www', 'app'])) {
            return $next($request);
        }

        $licenca = LicencaB2B::where('slug_empresa', $subdominio)->first();

        if (!$licenca) {
            return response()->json([
                'mensagem' => 'Empresa não encontrada.',
                'codigo'   => 'empresa_nao_encontrada',
            ], 404);
        }

        if (!$licenca->ativa()) {
            return response()->json([
                'mensagem' => 'Esta licença está suspensa ou expirada. Entre em contato com o suporte.',
                'codigo'   => 'licenca_inativa',
            ], 403);
        }

        // Disponibilizar a licença para toda a requisição
        app()->instance('licenca_b2b_atual', $licenca);
        $request->attributes->set('licenca_b2b', $licenca);

        return $next($request);
    }
}
```

**Registrar em `bootstrap/app.php`:**

```php
$middleware->alias([
    'b2b.tenant' => \App\Http\Middleware\IdentificarTenantB2B::class,
]);
```

**`config/b2b.php`:**

```php
return [
    'dominio_base' => env('B2B_DOMINIO_BASE', 'geopoliticainvestidores.com.br'),
];
```

---

### 5.4 Services

#### `LicencaB2BService`

**Responsabilidades:**
- Criar licença + criar primeiro `company_admin` da empresa
- Suspender licença (desativa acesso de todos os membros)
- Renovar contrato (atualiza datas de vigência)
- Verificar disponibilidade de vagas

```php
// app/Services/LicencaB2BService.php
namespace App\Services;

use App\Models\ConviteB2B;
use App\Models\LicencaB2B;
use App\Models\User;
use App\Mail\B2BConviteMail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class LicencaB2BService
{
    /**
     * Cria a licença e o primeiro company_admin.
     * Envia e-mail de convite ao admin inicial.
     */
    public function criar(array $dados): LicencaB2B
    {
        $licenca = LicencaB2B::create([
            'nome_empresa'     => $dados['nome_empresa'],
            'slug_empresa'     => $dados['slug_empresa'],
            'logo_url'         => $dados['logo_url'] ?? null,
            'max_usuarios'     => $dados['max_usuarios'],
            'plano'            => $dados['plano'] ?? 'pro',
            'valor_contrato'   => $dados['valor_contrato'] ?? null,
            'contrato_inicio'  => $dados['contrato_inicio'],
            'contrato_fim'     => $dados['contrato_fim'],
            'email_faturamento' => $dados['email_faturamento'],
            'notas_internas'   => $dados['notas_internas'] ?? null,
            'status'           => 'ativa',
        ]);

        // Convidar o admin inicial via convite
        $this->enviarConvite(
            licenca: $licenca,
            email: $dados['email_admin_inicial'],
            role: 'company_admin',
            convidadoPorId: null
        );

        return $licenca;
    }

    /**
     * Suspende a licença. Todos os membros perdem acesso imediato.
     */
    public function suspender(LicencaB2B $licenca): void
    {
        $licenca->update(['status' => 'suspensa']);
        // Tokens Sanctum dos membros continuam válidos mas serão barrados
        // pelo IdentificarTenantB2B que verifica licenca->ativa()
    }

    /**
     * Reativa uma licença suspensa ou renovada.
     */
    public function renovar(LicencaB2B $licenca, string $novaDataFim): void
    {
        $licenca->update([
            'status'       => 'ativa',
            'contrato_fim' => $novaDataFim,
        ]);
    }

    /**
     * Cria convite e envia e-mail com link de aceite.
     */
    public function enviarConvite(
        LicencaB2B $licenca,
        string $email,
        string $role,
        ?int $convidadoPorId
    ): ConviteB2B {
        $token = Str::uuid()->toString() . '-' . Str::random(8);

        $convite = ConviteB2B::create([
            'licenca_id'   => $licenca->id,
            'email'        => strtolower(trim($email)),
            'role'         => $role,
            'token'        => $token,
            'convidado_por' => $convidadoPorId,
            'expira_em'    => now()->addDays(7),
        ]);

        $dominioBase  = config('b2b.dominio_base');
        $frontendUrl  = config('app.frontend_url');
        $linkConvite  = "https://{$licenca->slug_empresa}.{$dominioBase}/convite/{$token}";

        Mail::to($email)->queue(new B2BConviteMail(
            nomeEmpresa: $licenca->nome_empresa,
            linkConvite: $linkConvite,
            role: $role
        ));

        return $convite;
    }
}
```

#### `MembroB2BService`

**Responsabilidades:**
- Validar vagas disponíveis antes de convidar
- Aceitar convite (cria User se necessário + cria MembroB2B + atribui role Spatie)
- Remover membro da licença
- Alterar role do membro

```php
// app/Services/MembroB2BService.php
namespace App\Services;

use App\Models\ConviteB2B;
use App\Models\LicencaB2B;
use App\Models\MembroB2B;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MembroB2BService
{
    /**
     * Verifica se há vagas e cria o convite.
     * Retorna erro se a licença atingiu o limite de usuários.
     */
    public function convidar(
        LicencaB2B $licenca,
        string $email,
        string $role,
        int $convidadoPorId,
        LicencaB2BService $licencaService
    ): ConviteB2B {
        if ($licenca->vagasDisponiveis() <= 0) {
            abort(409, "Limite de {$licenca->max_usuarios} usuários atingido para esta licença.");
        }

        // Verificar se e-mail já é membro ativo
        $jaEhMembro = MembroB2B::where('licenca_id', $licenca->id)
            ->where('email', strtolower($email))
            ->where('status', 'ativo')
            ->exists();

        if ($jaEhMembro) {
            abort(409, 'Este e-mail já é membro ativo desta licença.');
        }

        return $licencaService->enviarConvite($licenca, $email, $role, $convidadoPorId);
    }

    /**
     * Aceita o convite, criando conta se necessário.
     * Retorna o User criado ou encontrado.
     */
    public function aceitarConvite(ConviteB2B $convite, ?string $senha): User
    {
        $email = $convite->email;

        // Verificar ou criar usuário
        $usuario = User::where('email', $email)->first();

        if (!$usuario) {
            abort_if(empty($senha), 422, 'A senha é obrigatória para novo usuário.');

            $usuario = User::create([
                'name'     => explode('@', $email)[0], // Nome provisório
                'email'    => $email,
                'password' => Hash::make($senha),
            ]);
        }

        // Atribuir role Spatie baseado no plano da licença
        $plano = $convite->licenca->plano;
        $usuario->syncRoles(["assinante_{$plano}"]);

        // Criar registro de membro
        MembroB2B::updateOrCreate(
            ['licenca_id' => $convite->licenca_id, 'email' => $email],
            [
                'user_id'      => $usuario->id,
                'role'         => $convite->role,
                'status'       => 'ativo',
                'convidado_por' => $convite->convidado_por,
                'convidado_em' => $convite->created_at,
                'entrou_em'    => now(),
            ]
        );

        // Marcar convite como aceito
        $convite->update(['aceito_em' => now()]);

        // Criar assinante vinculado à licença B2B (se não existir)
        \App\Models\Assinante::firstOrCreate(
            ['user_id' => $usuario->id],
            [
                'plano'  => $plano,
                'ativo'  => true,
                'status' => 'ativo',
                'email'  => $email,
            ]
        );

        return $usuario;
    }

    /**
     * Remove membro da licença. Não deleta o User.
     */
    public function remover(MembroB2B $membro): void
    {
        $membro->update(['status' => 'suspenso']);
        // Role Spatie é mantido — usuário pode ter outros vínculos
        // Desativar assinante também para bloquear acesso
        \App\Models\Assinante::where('user_id', $membro->user_id)
            ->update(['ativo' => false]);
    }

    /**
     * Altera o role do membro (company_admin ↔ reader).
     */
    public function alterarRole(MembroB2B $membro, string $novoRole): void
    {
        $membro->update(['role' => $novoRole]);
    }

    /**
     * Verifica se o usuário é membro ativo de uma licença.
     */
    public function verificarAcesso(int $userId, LicencaB2B $licenca): ?MembroB2B
    {
        return MembroB2B::where('licenca_id', $licenca->id)
            ->where('user_id', $userId)
            ->where('status', 'ativo')
            ->first();
    }
}
```

---

### 5.5 FormRequests

```php
// app/Http/Requests/B2B/ConvidarMembroRequest.php
public function authorize(): bool { return true; }

public function rules(): array
{
    return [
        'email' => ['required', 'email'],
        'role'  => ['required', 'in:company_admin,reader'],
    ];
}

public function messages(): array
{
    return [
        'email.required' => 'O e-mail é obrigatório.',
        'email.email'    => 'Informe um e-mail válido.',
        'role.required'  => 'O papel (role) é obrigatório.',
        'role.in'        => 'O papel deve ser "company_admin" ou "reader".',
    ];
}
```

```php
// app/Http/Requests/B2B/AceitarConviteRequest.php
public function authorize(): bool { return true; }

public function rules(): array
{
    return [
        'senha'              => ['sometimes', 'string', 'min:8', 'confirmed'],
        'senha_confirmation' => ['required_with:senha'],
    ];
}
```

```php
// app/Http/Requests/Admin/SalvarLicencaB2BRequest.php
public function rules(): array
{
    return [
        'nome_empresa'       => ['required', 'string', 'max:255'],
        'slug_empresa'       => ['required', 'string', 'max:100', 'regex:/^[a-z0-9-]+$/', 'unique:licencas_b2b,slug_empresa'],
        'logo_url'           => ['nullable', 'url'],
        'max_usuarios'       => ['required', 'integer', 'min:1', 'max:500'],
        'plano'              => ['required', 'in:essencial,pro,reservado'],
        'valor_contrato'     => ['nullable', 'numeric', 'min:0'],
        'contrato_inicio'    => ['required', 'date'],
        'contrato_fim'       => ['required', 'date', 'after:contrato_inicio'],
        'email_faturamento'  => ['required', 'email'],
        'email_admin_inicial' => ['required', 'email'],
        'notas_internas'     => ['nullable', 'string'],
    ];
}
```

---

### 5.6 Controllers e Rotas

#### `B2BEmpresaController`

```php
// app/Http/Controllers/B2B/B2BEmpresaController.php
namespace App\Http\Controllers\B2B;

use App\Http\Controllers\Controller;
use App\Models\MembroB2B;
use App\Services\MembroB2BService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2BEmpresaController extends Controller
{
    public function __construct(
        private readonly MembroB2BService $membroService
    ) {}

    /**
     * GET /api/b2b/empresa
     * Dados da empresa + papel do usuário autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $licenca = $request->attributes->get('licenca_b2b');
        $usuario = $request->user();

        $membro = $this->membroService->verificarAcesso($usuario->id, $licenca);

        if (!$membro) {
            return response()->json([
                'mensagem' => 'Você não tem acesso a esta empresa.',
            ], 403);
        }

        return response()->json([
            'empresa' => [
                'nome'        => $licenca->nome_empresa,
                'slug'        => $licenca->slug_empresa,
                'logo_url'    => $licenca->logo_url,
                'plano'       => $licenca->plano,
                'max_usuarios' => $licenca->max_usuarios,
                'status'      => $licenca->status,
                'contrato_fim' => $licenca->contrato_fim?->toDateString(),
            ],
            'membro' => [
                'role'         => $membro->role,
                'is_admin'     => $membro->role === 'company_admin',
                'entrou_em'    => $membro->entrou_em?->toIso8601String(),
            ],
        ]);
    }
}
```

#### `B2BMembroController`

```php
// app/Http/Controllers/B2B/B2BMembroController.php
namespace App\Http\Controllers\B2B;

use App\Http\Controllers\Controller;
use App\Http\Requests\B2B\ConvidarMembroRequest;
use App\Models\MembroB2B;
use App\Services\LicencaB2BService;
use App\Services\MembroB2BService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2BMembroController extends Controller
{
    public function __construct(
        private readonly MembroB2BService $membroService,
        private readonly LicencaB2BService $licencaService,
    ) {}

    /**
     * GET /api/b2b/membros
     * Lista membros ativos e convites pendentes.
     * Apenas company_admin.
     */
    public function index(Request $request): JsonResponse
    {
        $licenca = $request->attributes->get('licenca_b2b');
        $usuario = $request->user();

        $membro = $this->membroService->verificarAcesso($usuario->id, $licenca);
        abort_unless($membro?->role === 'company_admin', 403, 'Apenas administradores podem gerenciar a equipe.');

        $membros = MembroB2B::where('licenca_id', $licenca->id)
            ->where('status', 'ativo')
            ->with('user:id,name,email')
            ->get();

        $pendentes = $licenca->convites()
            ->whereNull('aceito_em')
            ->where('expira_em', '>', now())
            ->get(['id', 'email', 'role', 'expira_em', 'created_at']);

        return response()->json([
            'membros'     => $membros,
            'pendentes'   => $pendentes,
            'max_usuarios' => $licenca->max_usuarios,
            'vagas_usadas' => $membros->count() + $pendentes->count(),
        ]);
    }

    /**
     * POST /api/b2b/membros
     * Convidar novo membro. Apenas company_admin.
     */
    public function store(ConvidarMembroRequest $request): JsonResponse
    {
        $licenca = $request->attributes->get('licenca_b2b');
        $usuario = $request->user();

        $membro = $this->membroService->verificarAcesso($usuario->id, $licenca);
        abort_unless($membro?->role === 'company_admin', 403);

        $convite = $this->membroService->convidar(
            licenca: $licenca,
            email: $request->validated('email'),
            role: $request->validated('role'),
            convidadoPorId: $usuario->id,
            licencaService: $this->licencaService
        );

        return response()->json([
            'mensagem' => 'Convite enviado com sucesso.',
            'convite'  => ['id' => $convite->id, 'email' => $convite->email, 'expira_em' => $convite->expira_em],
        ], 201);
    }

    /**
     * PATCH /api/b2b/membros/{id}
     * Alterar role. Apenas company_admin.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $licenca = $request->attributes->get('licenca_b2b');
        $usuario = $request->user();

        $membro = $this->membroService->verificarAcesso($usuario->id, $licenca);
        abort_unless($membro?->role === 'company_admin', 403);

        $membroAlvo = MembroB2B::where('licenca_id', $licenca->id)->findOrFail($id);
        $novoRole   = $request->input('role');
        abort_unless(in_array($novoRole, ['company_admin', 'reader']), 422, 'Role inválido.');

        $this->membroService->alterarRole($membroAlvo, $novoRole);

        return response()->json(['mensagem' => 'Papel atualizado com sucesso.']);
    }

    /**
     * DELETE /api/b2b/membros/{id}
     * Remover membro. Apenas company_admin.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $licenca = $request->attributes->get('licenca_b2b');
        $usuario = $request->user();

        $membro = $this->membroService->verificarAcesso($usuario->id, $licenca);
        abort_unless($membro?->role === 'company_admin', 403);

        $membroAlvo = MembroB2B::where('licenca_id', $licenca->id)->findOrFail($id);
        $this->membroService->remover($membroAlvo);

        return response()->json(['mensagem' => 'Membro removido com sucesso.']);
    }
}
```

#### `B2BConviteController`

```php
// app/Http/Controllers/B2B/B2BConviteController.php
namespace App\Http\Controllers\B2B;

use App\Http\Controllers\Controller;
use App\Http\Requests\B2B\AceitarConviteRequest;
use App\Models\ConviteB2B;
use App\Services\MembroB2BService;
use Illuminate\Http\JsonResponse;

class B2BConviteController extends Controller
{
    public function __construct(private readonly MembroB2BService $membroService) {}

    /**
     * GET /api/b2b/convite/{token}
     * Valida o token e retorna dados do convite.
     */
    public function show(string $token): JsonResponse
    {
        $convite = ConviteB2B::with('licenca:id,nome_empresa,slug_empresa')
            ->where('token', $token)
            ->first();

        if (!$convite || !$convite->valido()) {
            return response()->json([
                'mensagem' => 'Convite inválido ou expirado.',
            ], 404);
        }

        // Verificar se já é usuário existente
        $usuarioExiste = \App\Models\User::where('email', $convite->email)->exists();

        return response()->json([
            'convite' => [
                'email'        => $convite->email,
                'role'         => $convite->role,
                'expira_em'    => $convite->expira_em->toIso8601String(),
                'empresa'      => $convite->licenca->nome_empresa,
                'slug_empresa' => $convite->licenca->slug_empresa,
            ],
            'usuario_existente' => $usuarioExiste,
        ]);
    }

    /**
     * POST /api/b2b/convite/{token}
     * Aceita o convite e cria/vincula a conta.
     */
    public function aceitar(AceitarConviteRequest $request, string $token): JsonResponse
    {
        $convite = ConviteB2B::where('token', $token)->first();

        if (!$convite || !$convite->valido()) {
            return response()->json(['mensagem' => 'Convite inválido ou expirado.'], 404);
        }

        $usuario = $this->membroService->aceitarConvite(
            convite: $convite,
            senha: $request->validated('senha')
        );

        return response()->json([
            'mensagem' => 'Bem-vindo! Sua conta está ativa.',
            'email'    => $usuario->email,
        ]);
    }
}
```

#### `AdminLicencasB2BController`

```php
// app/Http/Controllers/Admin/AdminLicencasB2BController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SalvarLicencaB2BRequest;
use App\Models\LicencaB2B;
use App\Services\LicencaB2BService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminLicencasB2BController extends Controller
{
    public function __construct(
        private readonly LicencaB2BService $licencaService
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);

        $licencas = LicencaB2B::withCount(['membros as membros_ativos' => fn($q) => $q->where('status', 'ativo')])
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return response()->json($licencas);
    }

    public function store(SalvarLicencaB2BRequest $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);

        $licenca = $this->licencaService->criar($request->validated());

        return response()->json([
            'mensagem' => 'Licença criada. Convite enviado ao admin inicial.',
            'licenca'  => $licenca,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);

        $licenca = LicencaB2B::with([
            'membros.user:id,name,email',
            'convites' => fn($q) => $q->whereNull('aceito_em')->where('expira_em', '>', now()),
        ])->findOrFail($id);

        return response()->json($licenca);
    }

    public function update(SalvarLicencaB2BRequest $request, int $id): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);

        $licenca = LicencaB2B::findOrFail($id);
        $licenca->update($request->validated());

        return response()->json(['mensagem' => 'Licença atualizada.', 'licenca' => $licenca]);
    }

    public function suspender(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);
        $licenca = LicencaB2B::findOrFail($id);
        $this->licencaService->suspender($licenca);
        return response()->json(['mensagem' => 'Licença suspensa.']);
    }

    public function renovar(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403);
        $licenca = LicencaB2B::findOrFail($id);
        $this->licencaService->renovar($licenca, $request->input('nova_data_fim'));
        return response()->json(['mensagem' => 'Licença renovada.', 'licenca' => $licenca->fresh()]);
    }
}
```

#### `routes/api.php` — adições do M11

```php
// routes/api.php

// ── Rotas B2B (identificadas pelo subdomínio via middleware b2b.tenant) ────
// O middleware b2b.tenant é aplicado primeiro, antes do auth:sanctum,
// para identificar a empresa pelo subdomínio da requisição.
Route::middleware(['b2b.tenant', 'auth:sanctum'])->prefix('b2b')->group(function () {

    // Dados da empresa (qualquer membro autenticado)
    Route::get('/empresa', [B2BEmpresaController::class, 'show']);

    // Membros (apenas company_admin)
    Route::get('/membros',           [B2BMembroController::class, 'index']);
    Route::post('/membros',          [B2BMembroController::class, 'store']);
    Route::patch('/membros/{id}',    [B2BMembroController::class, 'update']);
    Route::delete('/membros/{id}',   [B2BMembroController::class, 'destroy']);
});

// Convites (sem auth — usuário pode não ter conta ainda)
Route::prefix('b2b/convite')->group(function () {
    Route::get('/{token}',  [B2BConviteController::class, 'show']);
    Route::post('/{token}', [B2BConviteController::class, 'aceitar']);
});

// ── Painel admin canal (CRUD de licenças) ──────────────────────────────────
Route::middleware(['auth:sanctum', 'assinante.ativo', 'role:admin'])
     ->prefix('admin/b2b')
     ->group(function () {
         Route::get('/',                [AdminLicencasB2BController::class, 'index']);
         Route::post('/',               [AdminLicencasB2BController::class, 'store']);
         Route::get('/{id}',            [AdminLicencasB2BController::class, 'show']);
         Route::put('/{id}',            [AdminLicencasB2BController::class, 'update']);
         Route::post('/{id}/suspender', [AdminLicencasB2BController::class, 'suspender']);
         Route::post('/{id}/renovar',   [AdminLicencasB2BController::class, 'renovar']);
     });
```

---

## 6. Endpoints da API

### `GET /api/b2b/empresa`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/b2b/empresa` |
| Middleware | `b2b.tenant`, `auth:sanctum` |

**Response 200:**
```json
{
  "empresa": {
    "nome": "BlackRock Brasil",
    "slug": "blackrock-brasil",
    "logo_url": "https://cdn.../logo-blackrock.png",
    "plano": "pro",
    "max_usuarios": 15,
    "status": "ativa",
    "contrato_fim": "2027-04-14"
  },
  "membro": {
    "role": "company_admin",
    "is_admin": true,
    "entrou_em": "2026-04-14T10:00:00Z"
  }
}
```

---

### `GET /api/b2b/membros`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/b2b/membros` |
| Middleware | `b2b.tenant`, `auth:sanctum` (apenas `company_admin`) |

**Response 200:**
```json
{
  "membros": [
    { "id": 1, "email": "ana@blackrock.com", "role": "company_admin", "status": "ativo", "entrou_em": "2026-04-14T10:00:00Z", "user": { "name": "Ana Lima" } }
  ],
  "pendentes": [
    { "id": 3, "email": "carlos@blackrock.com", "role": "reader", "expira_em": "2026-04-21T10:00:00Z" }
  ],
  "max_usuarios": 15,
  "vagas_usadas": 2
}
```

---

### `POST /api/b2b/membros`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/b2b/membros` |
| Middleware | `b2b.tenant`, `auth:sanctum` (apenas `company_admin`) |

**Body:**
```json
{ "email": "carlos@blackrock.com", "role": "reader" }
```

**Response 201:**
```json
{
  "mensagem": "Convite enviado com sucesso.",
  "convite": { "id": 3, "email": "carlos@blackrock.com", "expira_em": "2026-04-21T10:00:00Z" }
}
```

**Response 409:** Limite atingido ou e-mail já é membro.

---

### `GET /api/b2b/convite/{token}`

| Campo | Detalhe |
|---|---|
| Método | GET |
| Path | `/api/b2b/convite/{token}` |
| Middleware | Nenhum (público) |

**Response 200:**
```json
{
  "convite": { "email": "carlos@blackrock.com", "role": "reader", "empresa": "BlackRock Brasil", "slug_empresa": "blackrock-brasil", "expira_em": "2026-04-21T10:00:00Z" },
  "usuario_existente": false
}
```

---

### `POST /api/b2b/convite/{token}`

| Campo | Detalhe |
|---|---|
| Método | POST |
| Path | `/api/b2b/convite/{token}` |
| Middleware | Nenhum (público) |

**Body (para novo usuário — senha obrigatória):**
```json
{ "senha": "NovaSenha@123", "senha_confirmation": "NovaSenha@123" }
```

**Body (para usuário existente — sem senha):**
```json
{}
```

**Response 200:**
```json
{ "mensagem": "Bem-vindo! Sua conta está ativa.", "email": "carlos@blackrock.com" }
```

---

## 7. Frontend React

### 7.1 Estrutura de Arquivos

```
src/
├── pages/
│   ├── b2b/
│   │   ├── DashboardB2B.tsx           ← layout com logo da empresa
│   │   ├── EquipeB2B.tsx              ← painel de gestão de equipe (company_admin)
│   │   └── ConviteB2B.tsx             ← página de aceite de convite
│   └── admin/
│       └── AdminLicencasB2B.tsx       ← gestão de licenças pelo admin do canal
├── components/
│   └── b2b/
│       ├── B2BLayout.tsx              ← layout com logo customizado
│       ├── TeamPanel.tsx              ← container do painel de equipe
│       ├── MembersList.tsx            ← lista de membros ativos + pendentes
│       └── InviteMemberModal.tsx      ← modal de convite
└── hooks/
    ├── useB2BEmpresa.ts               ← React Query: dados da empresa
    └── useB2BMembros.ts               ← React Query: membros e convites
```

---

### 7.2 Componentes Principais

#### `B2BLayout` — Layout com logo customizado

```tsx
// src/components/b2b/B2BLayout.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Outlet } from 'react-router-dom';

export function B2BLayout() {
  const { data } = useQuery({
    queryKey: ['b2b', 'empresa'],
    queryFn: () => api.get('/b2b/empresa').then(r => r.data),
    staleTime: Infinity, // Dados da empresa não mudam durante a sessão
  });

  const empresa = data?.empresa;

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Navegação com logo da empresa */}
      <nav className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {empresa?.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nome}
              className="h-7 object-contain" />
          ) : (
            <span className="text-[#f0ece2] text-sm font-serif">
              {empresa?.nome ?? 'Carregando...'}
            </span>
          )}
          <span className="text-white/20 text-xs">· Geopolítica para Investidores</span>
        </div>

        {/* Mesma navegação do dashboard padrão */}
        <nav className="flex items-center gap-6 text-[11px] tracking-wider uppercase">
          {/* Links dos módulos 01–09 */}
        </nav>
      </nav>

      <Outlet />
    </div>
  );
}
```

#### `TeamPanel` e `MembersList`

```tsx
// src/components/b2b/TeamPanel.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { MembersList } from './MembersList';
import { InviteMemberModal } from './InviteMemberModal';

export function TeamPanel() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['b2b', 'membros'],
    queryFn: () => api.get('/b2b/membros').then(r => r.data),
    staleTime: 30_000,
  });

  const vagasDisponiveis = (data?.max_usuarios ?? 0) - (data?.vagas_usadas ?? 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#f0ece2] font-serif text-xl font-bold">Gestão de Equipe</h1>
          <p className="text-white/30 text-xs mt-1">
            {data?.vagas_usadas ?? 0} de {data?.max_usuarios ?? '—'} usuários utilizados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={vagasDisponiveis <= 0}
          className="bg-[#c9b882] text-[#0a0a0b] text-xs tracking-wider uppercase
                     px-4 py-2 font-medium hover:bg-[#d9ca99] transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Convidar membro
        </button>
      </div>

      {isLoading ? (
        <p className="text-white/30 text-sm">Carregando...</p>
      ) : (
        <MembersList
          membros={data?.membros ?? []}
          pendentes={data?.pendentes ?? []}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['b2b', 'membros'] })}
        />
      )}

      {showModal && (
        <InviteMemberModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['b2b', 'membros'] });
          }}
        />
      )}
    </div>
  );
}
```

```tsx
// src/components/b2b/MembersList.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export function MembersList({ membros, pendentes, onUpdate }: any) {
  const queryClient = useQueryClient();

  const alterarRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.patch(`/b2b/membros/${id}`, { role }),
    onSuccess: onUpdate,
  });

  const remover = useMutation({
    mutationFn: (id: number) => api.delete(`/b2b/membros/${id}`),
    onSuccess: onUpdate,
  });

  return (
    <div className="space-y-px">
      {/* Membros ativos */}
      {membros.map((m: any) => (
        <div key={m.id}
          className="flex items-center justify-between border border-white/5 px-4 py-3
                     hover:border-white/10 transition-colors">
          <div>
            <p className="text-sm text-[#e8e4dc]">{m.email}</p>
            <p className="text-xs text-white/30 mt-0.5">
              Desde {new Date(m.entrou_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={m.role}
              onChange={e => alterarRole.mutate({ id: m.id, role: e.target.value })}
              className="bg-[#111] border border-white/10 text-white/60 text-xs px-2 py-1"
            >
              <option value="reader">Leitor</option>
              <option value="company_admin">Admin</option>
            </select>
            <button
              onClick={() => { if (confirm('Remover este membro?')) remover.mutate(m.id); }}
              className="text-white/20 hover:text-red-400 text-xs transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      ))}

      {/* Convites pendentes */}
      {pendentes.length > 0 && (
        <>
          <p className="text-[10px] tracking-widest uppercase text-white/25 mt-4 mb-2">
            Convites pendentes
          </p>
          {pendentes.map((c: any) => (
            <div key={c.id}
              className="flex items-center justify-between border border-white/5 border-dashed px-4 py-3">
              <div>
                <p className="text-sm text-white/40">{c.email}</p>
                <p className="text-xs text-white/20 mt-0.5">
                  Expira {new Date(c.expira_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="text-[10px] tracking-wider uppercase border border-yellow-400/30 text-yellow-400 px-2 py-0.5">
                Aguardando
              </span>
            </div>
          ))}
        </>
      )}

      {membros.length === 0 && pendentes.length === 0 && (
        <p className="text-white/25 text-xs px-4 py-8 text-center">
          Nenhum membro cadastrado. Convide sua equipe.
        </p>
      )}
    </div>
  );
}
```

---

## 8. Template de E-mail de Convite

```php
// app/Mail/B2BConviteMail.php
namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class B2BConviteMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public readonly string $nomeEmpresa,
        public readonly string $linkConvite,
        public readonly string $role,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Convite para acessar {$this->nomeEmpresa} — Geopolítica para Investidores"
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.b2b-convite');
    }
}
```

```blade
{{-- resources/views/emails/b2b-convite.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="background:#0a0a0b;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <p style="color:#C9B882;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
      Geopolítica para Investidores
    </p>
    <h1 style="color:#F0ECE2;font-size:22px;font-weight:700;margin:16px 0;">
      Você foi convidado para {{ $nomeEmpresa }}
    </h1>
    <p style="color:#A0A0A0;font-size:15px;line-height:1.8;">
      Você recebeu um convite para acessar o dashboard de inteligência geopolítica de
      <strong style="color:#E8E4DC;">{{ $nomeEmpresa }}</strong> como
      <strong style="color:#C9B882;">{{ $role === 'company_admin' ? 'Administrador' : 'Leitor' }}</strong>.
    </p>
    <hr style="border-color:#2a2a2a;margin:24px 0;">
    <div style="text-align:center;">
      <a href="{{ $linkConvite }}"
         style="display:inline-block;background:#C9B882;color:#0a0a0b;font-size:11px;
                letter-spacing:0.1em;text-transform:uppercase;padding:14px 32px;
                text-decoration:none;font-weight:500;">
        Aceitar convite
      </a>
    </div>
    <p style="color:#444;font-size:11px;margin-top:24px;">
      Este link expira em 7 dias.
    </p>
  </div>
</body>
</html>
```

---

## 9. Agendamentos (Laravel Scheduler)

```php
// routes/console.php (Laravel 13)

use Illuminate\Support\Facades\Schedule;
use App\Models\LicencaB2B;
use Illuminate\Support\Facades\Mail;

// Verifica contratos próximos de expirar e notifica o admin do canal
Schedule::call(function () {
    $diasParaAvisar = [30, 15, 7];

    foreach ($diasParaAvisar as $dias) {
        $dataAlvo = now()->addDays($dias)->toDateString();

        LicencaB2B::where('status', 'ativa')
            ->where('contrato_fim', $dataAlvo)
            ->each(function (LicencaB2B $licenca) use ($dias) {
                $emailAdmin = config('mail.from.address');
                Mail::to($emailAdmin)->queue(new \App\Mail\LicencaExpirandoMail(
                    nomeLicenca: $licenca->nome_empresa,
                    diasRestantes: $dias,
                    dataExpiracao: $licenca->contrato_fim->format('d/m/Y'),
                    emailFaturamento: $licenca->email_faturamento
                ));
            });
    }
})
->dailyAt('08:00')
->timezone('America/Sao_Paulo')
->name('b2b:verificar-expiracao')
->withoutOverlapping();
```

---

## 10. Jobs / Queues

Todos os e-mails de convite são disparados em fila com `Mail::to()->queue()`.

```bash
QUEUE_CONNECTION=redis
php artisan queue:work redis --tries=3 --timeout=30
```

---

## 11. Controle de Acesso

| Role Spatie | Permissões neste módulo |
|---|---|
| `assinante_pro` / `assinante_reservado` | Acesso ao dashboard B2B via subdomínio (atribuído ao aceitar convite) |
| `company_admin` (role B2B interno no campo `membros_b2b.role`) | Convidar/remover membros, alterar roles, ver equipe |
| `reader` (role B2B interno) | Acesso ao dashboard B2B como leitor |
| `admin` | Criar, editar, suspender e renovar licenças pelo painel admin |

**Importante:** Os roles B2B (`company_admin`, `reader`) são armazenados na coluna `membros_b2b.role`, não como roles Spatie. O role Spatie do usuário é `assinante_pro` ou `assinante_reservado` (baseado no plano da licença), que determina o nível de acesso ao conteúdo.

---

## 12. Error Handling

| Código HTTP | Situação | Mensagem padrão |
|---|---|---|
| 401 | Token ausente ou inválido | `"Não autenticado."` |
| 403 | Licença inativa/suspensa | `"Esta licença está suspensa ou expirada."` |
| 403 | Não é membro da empresa | `"Você não tem acesso a esta empresa."` |
| 403 | Ação requer `company_admin` | `"Apenas administradores podem gerenciar a equipe."` |
| 404 | Empresa não encontrada pelo slug | `"Empresa não encontrada."` |
| 404 | Convite inválido ou expirado | `"Convite inválido ou expirado."` |
| 409 | Limite de usuários atingido | `"Limite de X usuários atingido para esta licença."` |
| 409 | E-mail já é membro | `"Este e-mail já é membro ativo desta licença."` |
| 422 | Senha obrigatória para novo usuário | `"A senha é obrigatória para novo usuário."` |

---

## 13. Infraestrutura de Subdomínio

**DNS:**
```
*.geopoliticainvestidores.com.br → CNAME → IP ou load balancer do servidor
```

**Nginx (Laravel Forge ou manual):**
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name *.geopoliticainvestidores.com.br;
    ssl_certificate /etc/letsencrypt/live/geopoliticainvestidores.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/geopoliticainvestidores.com.br/privkey.pem;
    root /var/www/html/public;
    # ... configuração padrão do Laravel
}
```

**Let's Encrypt (wildcard):**
```bash
certbot certonly --dns-cloudflare \
  -d geopoliticainvestidores.com.br \
  -d *.geopoliticainvestidores.com.br
```

---

## 14. Checklist de Entrega

### Infraestrutura
- [ ] Wildcard DNS `*.geopoliticainvestidores.com.br` configurado e propagado
- [ ] Wildcard SSL configurado para `*.dominio.com.br`
- [ ] Nginx configurado para aceitar todos os subdomínios na mesma app Laravel
- [ ] `B2B_DOMINIO_BASE` configurado no `.env`

### Banco de dados
- [ ] Migration `create_licencas_b2b_table` executada com todos os índices
- [ ] Migration `create_membros_b2b_table` executada com UNIQUE em `licenca_id + email`
- [ ] Migration `create_convites_b2b_table` executada com UNIQUE em `token`

### Configuração
- [ ] `config/b2b.php` criado com `dominio_base`
- [ ] `IdentificarTenantB2B` registrado como alias `b2b.tenant` no `bootstrap/app.php`
- [ ] Roles B2B adicionados ao `RolesSeeder` do M00 (se necessário)
- [ ] E-mails de convite e expiração configurados e testados

### Backend Laravel
- [ ] `IdentificarTenantB2B` resolvendo empresa pelo subdomínio corretamente
- [ ] Licença inativa bloqueando acesso com mensagem clara
- [ ] `B2BEmpresaController::show` verificando pertencimento do usuário
- [ ] `B2BMembroController::index` somente para `company_admin`
- [ ] `B2BMembroController::store` verificando vagas disponíveis
- [ ] `B2BConviteController::show` retornando se usuário já existe
- [ ] `B2BConviteController::aceitar` criando User + MembroB2B + Assinante + syncRoles
- [ ] `LicencaB2BService::criar` enviando convite ao admin inicial
- [ ] `MembroB2BService::aceitarConvite` sendo idempotente (updateOrCreate)
- [ ] Todos os e-mails enfileirados com `queue()`
- [ ] Scheduler de expiração configurado para 08:00 BRT

### Frontend React
- [ ] `B2BLayout` carregando logo da empresa corretamente
- [ ] Nome da empresa exibido quando não há logo
- [ ] `TeamPanel` exibindo vagas usadas vs. máximo
- [ ] `MembersList` com membros ativos e convites pendentes
- [ ] Alterar role do membro funcionando via PATCH
- [ ] Remover membro com confirmação via DELETE
- [ ] `InviteMemberModal` enviando convite via POST
- [ ] Página de aceite `/convite/:token` exibindo dados do convite
- [ ] Formulário de senha exibido apenas para novos usuários
- [ ] Após aceitar, redirecionar para o dashboard da empresa no subdomínio
- [ ] Todos os módulos 01–09 acessíveis via subdomínio B2B

### Painel admin do canal
- [ ] `/admin/b2b` listando licenças com contagem de membros ativos
- [ ] Formulário de nova licença criando licença + enviando convite ao admin
- [ ] Suspensão bloqueando acesso de todos os membros imediatamente
- [ ] Renovação atualizando `contrato_fim` e `status = ativa`

### Testes end-to-end
- [ ] Criar licença via painel admin → convite chega ao admin inicial
- [ ] Admin aceita convite → conta criada → acesso ao subdomínio
- [ ] Admin da empresa convida leitor → leitor aceita → acessa dashboard
- [ ] Admin altera role do leitor para company_admin
- [ ] Admin remove membro → acesso bloqueado
- [ ] Suspensão da licença bloqueia todos os membros
- [ ] Renovação reativa o acesso
