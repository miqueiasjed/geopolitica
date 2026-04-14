# PRD — Módulo 3: Biblioteca de Conteúdo
**Projeto:** Geopolítica para Investidores — Dashboard de Inteligência Geopolítica
**Versão:** 2.0 (reescrito para Laravel 13 + React SPA)
**Data:** Abril 2026
**Depende de:** Módulos 1 e 2 concluídos (apenas a infraestrutura de autenticação)
**Status:** Aprovado para desenvolvimento

---

## 1. Visão Geral

O Módulo 3 é a **Biblioteca de Conteúdo** — o arquivo navegável de toda a produção do canal. O assinante acessa **Briefings Diários**, **Mapas da Semana** e edições de **A Tese** em um único lugar, com busca por palavra-chave e filtros combinados por período, tipo de conteúdo e região geográfica.

O conteúdo é publicado manualmente pelo administrador através de um **painel interno protegido** com o role `admin`. O fluxo de publicação é: colar o texto no editor rich-text, preencher os metadados (tipo, plano mínimo, região, tags), clicar em "Publicar agora" ou "Salvar rascunho". O conteúdo aparece imediatamente na Biblioteca para os assinantes com o plano correto.

### Controle de Acesso por Plano

| Plano | Acesso na Biblioteca |
|-------|---------------------|
| `assinante_essencial` | Apenas Briefings Diários |
| `assinante_pro` | Briefings + Mapa da Semana + A Tese |
| `assinante_reservado` | Tudo, incluindo arquivo histórico completo sem limite de data |
| `admin` | Acesso total + painel de publicação em `/admin/biblioteca` |

### Tipos de Conteúdo

| Tipo | Slug | Badge |
|------|------|-------|
| Briefing Diário | `briefing` | Azul |
| Mapa da Semana | `mapa` | Amarelo |
| A Tese | `tese` | Dourado |

### Dica Operacional
O fluxo mais eficiente é: gerar o conteúdo no Projeto do Claude → copiar o texto → colar no editor do painel admin → preencher metadados → publicar. O processo inteiro leva menos de 3 minutos por publicação.

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Backend | Laravel 13 (reusa Módulos 1 e 2) | — |
| Autenticação/Auth | Sanctum + Spatie Permission | Roles por plano + role `admin` |
| Busca full-text | MySQL FULLTEXT + `MATCH AGAINST` | Busca nativa no banco, sem serviço extra |
| Paginação | Cursor-based (`cursorPaginate`) | Eficiente para listas longas com filtros |
| Frontend Editor | TipTap (React + ProseMirror) | Rich text leve, extensível, sem dependências externas |
| Highlight busca | `mark.js` | Destaca termos buscados nos resultados |
| Estilo | TailwindCSS (reusa Módulos 1/2) | — |

**Dependências npm a instalar:**
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-placeholder mark.js
npm install -D @types/mark.js
```

---

## 3. Dependências de Outros Módulos

| Módulo | Dependência | Tipo |
|--------|-------------|------|
| Módulo 1 | Sistema de autenticação (Sanctum + roles Spatie) | Obrigatória |
| Módulo 1 | Model `User` com roles | Obrigatória |
| Módulo 2 | Nenhuma dependência de dados | — |

> **Nota:** Não é necessário que os Módulos 1 e 2 tenham dados em produção — apenas a estrutura de autenticação precisa existir.

---

## 4. Prazo MVP e Custo Estimado

| Item | Valor |
|------|-------|
| Prazo MVP | 4 dias de desenvolvimento |
| Custo estimado | R$ 6.000 – R$ 14.000 |
| Custo mensal adicional | R$ 0 (usa infraestrutura existente) |

**Cronograma:**

| Dia | Foco | Entregáveis |
|-----|------|-------------|
| Dia 1 | Banco e autenticação | Tabela `conteudos`, migrations, política de acesso por role, índice full-text, seeder |
| Dia 2 | API e painel admin | Todos os endpoints, AdminEditor TipTap, formulário de publicação funcionando |
| Dia 3 | Interface Biblioteca | Listagem, busca, filtros, paginação, `ContentCard`, página de leitura |
| Dia 4 | Integração e testes | `PlanGate`, navegação, teste por plano, ajustes finais |

---

## 5. Arquitetura Laravel

### 5.1 Estrutura de Arquivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── BibliotecaController.php           ← listagem pública (assinantes)
│   │       ├── ConteudoController.php             ← leitura individual (assinantes)
│   │       └── Admin/
│   │           └── AdminConteudoController.php    ← CRUD admin
│   ├── Requests/
│   │   ├── BibliotecaFiltroRequest.php            ← validação de filtros de listagem
│   │   └── Admin/
│   │       ├── CriarConteudoRequest.php           ← validação de criação
│   │       └── AtualizarConteudoRequest.php       ← validação de edição
│   ├── Resources/
│   │   ├── ConteudoResource.php                   ← response completo (leitura)
│   │   └── ConteudoCardResource.php               ← response resumido (listagem)
│   └── Middleware/
│       └── VerificarAcessoConteudo.php            ← bloqueia por plano
├── Models/
│   └── Conteudo.php
├── Services/
│   └── ConteudoService.php                        ← lógica de criação, slug, publicação
└── Policies/
    └── ConteudoPolicy.php                         ← regras de acesso por role

database/
├── migrations/
│   └── 2026_04_01_000005_create_conteudos_table.php
```

### 5.2 Models e Migrations

#### Migration: `create_conteudos_table`
```php
Schema::create('conteudos', function (Blueprint $table) {
    $table->id();

    // Identificação
    $table->string('tipo')->comment('briefing|mapa|tese');
    $table->string('titulo');
    $table->string('slug')->unique();

    // Conteúdo
    $table->longText('corpo');          // HTML gerado pelo TipTap
    $table->text('resumo')->nullable(); // Máx. 200 chars para listagem

    // Metadados editoriais
    $table->string('regiao')->nullable();
    $table->json('tags')->nullable();
    $table->text('tese_manchete')->nullable();  // "Em uma frase" — só para A Tese

    // Controle de acesso por plano
    $table->string('plano_minimo')->default('essencial')
        ->comment('essencial|pro|reservado');

    // Publicação
    $table->timestamp('publicado_em')->nullable();   // NULL = rascunho
    $table->boolean('publicado')->default(false);
    $table->timestamps();

    $table->index('tipo');
    $table->index(['publicado', 'publicado_em']);
    $table->index('plano_minimo');
    $table->fullText(['titulo', 'corpo']);
});
```

#### Model: `Conteudo`
```php
// app/Models/Conteudo.php
class Conteudo extends Model
{
    protected $table = 'conteudos';

    protected $fillable = [
        'tipo', 'titulo', 'slug', 'corpo', 'resumo',
        'regiao', 'tags', 'tese_manchete',
        'plano_minimo', 'publicado_em', 'publicado',
    ];

    protected $casts = [
        'tags'          => 'array',
        'publicado'     => 'boolean',
        'publicado_em'  => 'datetime',
    ];

    // Scope: apenas publicados
    public function scopePublicados($query): void
    {
        $query->where('publicado', true)
              ->whereNotNull('publicado_em');
    }

    // Scope: filtra por plano do usuário autenticado
    public function scopeAcessivelPor($query, string $role): void
    {
        $planos = match($role) {
            'assinante_essencial'  => ['essencial'],
            'assinante_pro'        => ['essencial', 'pro'],
            'assinante_reservado'  => ['essencial', 'pro', 'reservado'],
            'admin'                => ['essencial', 'pro', 'reservado'],
            default                => [],
        };

        $query->whereIn('plano_minimo', $planos);

        // Essencial: acesso apenas a briefings
        if ($role === 'assinante_essencial') {
            $query->where('tipo', 'briefing');
        }

        // Essencial e Pro: limitado a 90 dias de histórico
        if (in_array($role, ['assinante_essencial', 'assinante_pro'])) {
            $query->where('publicado_em', '>=', now()->subDays(90));
        }
    }

    // Gera slug único a partir do título
    public static function gerarSlug(string $titulo): string
    {
        $base = \Str::slug($titulo);
        return $base . '-' . now()->timestamp;
    }
}
```

### 5.3 Services

#### `ConteudoService`
```php
// app/Services/ConteudoService.php
namespace App\Services;

use App\Models\Conteudo;
use Illuminate\Contracts\Pagination\CursorPaginator;

class ConteudoService
{
    /**
     * Lista conteúdos com filtros combinados e paginação por cursor.
     * Aplica restrições de plano automaticamente via scope do Model.
     */
    public function listar(
        string $role,
        array  $filtros,
        int    $limite = 20,
    ): CursorPaginator {
        $query = Conteudo::publicados()
            ->acessivelPor($role)
            ->orderByDesc('publicado_em');

        if (!empty($filtros['q'])) {
            $query->whereRaw(
                "MATCH(titulo, corpo) AGAINST(? IN BOOLEAN MODE)",
                [$filtros['q'] . '*']
            );
        }

        if (!empty($filtros['tipo']))   $query->where('tipo', $filtros['tipo']);
        if (!empty($filtros['regiao'])) $query->where('regiao', 'LIKE', "%{$filtros['regiao']}%");
        if (!empty($filtros['de']))     $query->whereDate('publicado_em', '>=', $filtros['de']);
        if (!empty($filtros['ate']))    $query->whereDate('publicado_em', '<=', $filtros['ate']);

        return $query->cursorPaginate($limite);
    }

    /**
     * Busca conteúdo individual por slug.
     * Retorna null se o usuário não tiver plano suficiente (404 no controller).
     */
    public function buscarPorSlug(string $slug, string $role): ?Conteudo
    {
        return Conteudo::publicados()
            ->acessivelPor($role)
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Cria novo conteúdo. Se publicar_agora = true, define publicado_em agora.
     */
    public function criar(array $dados): Conteudo
    {
        $dados['slug'] = Conteudo::gerarSlug($dados['titulo']);

        if (!empty($dados['publicar_agora'])) {
            $dados['publicado']    = true;
            $dados['publicado_em'] = now();
        }

        return Conteudo::create($dados);
    }

    /**
     * Atualiza conteúdo existente.
     * Se publicando agora e publicado_em ainda null, define para now().
     */
    public function atualizar(Conteudo $conteudo, array $dados): Conteudo
    {
        if (!empty($dados['publicado']) && is_null($conteudo->publicado_em)) {
            $dados['publicado_em'] = now();
        }

        $conteudo->update($dados);
        return $conteudo->fresh();
    }

    /**
     * Soft delete — despublica sem apagar do banco.
     */
    public function despublicar(Conteudo $conteudo): void
    {
        $conteudo->update(['publicado' => false]);
    }
}
```

### 5.4 FormRequests

```php
// app/Http/Requests/BibliotecaFiltroRequest.php
class BibliotecaFiltroRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'q'      => ['nullable', 'string', 'max:200'],
            'tipo'   => ['nullable', 'in:briefing,mapa,tese'],
            'regiao' => ['nullable', 'string', 'max:100'],
            'de'     => ['nullable', 'date'],
            'ate'    => ['nullable', 'date', 'after_or_equal:de'],
            'cursor' => ['nullable', 'string'],
            'limite' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}

// app/Http/Requests/Admin/CriarConteudoRequest.php
class CriarConteudoRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'tipo'           => ['required', 'in:briefing,mapa,tese'],
            'titulo'         => ['required', 'string', 'max:255'],
            'corpo'          => ['required', 'string', 'max:1000000'],
            'resumo'         => ['nullable', 'string', 'max:200'],
            'regiao'         => ['nullable', 'string', 'max:100'],
            'tags'           => ['nullable', 'array'],
            'tags.*'         => ['string', 'max:50'],
            'tese_manchete'  => ['nullable', 'string', 'max:300'],
            'plano_minimo'   => ['required', 'in:essencial,pro,reservado'],
            'publicar_agora' => ['boolean'],
        ];
    }
}

// app/Http/Requests/Admin/AtualizarConteudoRequest.php
class AtualizarConteudoRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'titulo'        => ['sometimes', 'string', 'max:255'],
            'corpo'         => ['sometimes', 'string', 'max:1000000'],
            'resumo'        => ['nullable', 'string', 'max:200'],
            'regiao'        => ['nullable', 'string', 'max:100'],
            'tags'          => ['nullable', 'array'],
            'tese_manchete' => ['nullable', 'string', 'max:300'],
            'plano_minimo'  => ['sometimes', 'in:essencial,pro,reservado'],
            'publicado'     => ['sometimes', 'boolean'],
        ];
    }
}
```

### 5.5 Controllers e Rotas

```php
// app/Http/Controllers/Api/BibliotecaController.php
class BibliotecaController extends Controller
{
    public function __construct(private ConteudoService $servico) {}

    public function index(BibliotecaFiltroRequest $request): JsonResponse
    {
        $role    = $request->user()->roles->first()?->name ?? 'assinante_essencial';
        $filtros = $request->validated();
        $limite  = $filtros['limite'] ?? 20;

        $paginado = $this->servico->listar($role, $filtros, $limite);

        return response()->json([
            'itens'       => ConteudoCardResource::collection($paginado->items()),
            'next_cursor' => $paginado->nextCursor()?->encode(),
            'has_more'    => $paginado->hasMorePages(),
        ]);
    }
}

// app/Http/Controllers/Api/ConteudoController.php
class ConteudoController extends Controller
{
    public function __construct(private ConteudoService $servico) {}

    public function show(Request $request, string $slug): JsonResponse
    {
        $role     = $request->user()->roles->first()?->name ?? 'assinante_essencial';
        $conteudo = $this->servico->buscarPorSlug($slug, $role);

        if (!$conteudo) {
            return response()->json(['erro' => 'Conteúdo não encontrado ou acesso restrito.'], 404);
        }

        return response()->json(['conteudo' => new ConteudoResource($conteudo)]);
    }
}

// app/Http/Controllers/Api/Admin/AdminConteudoController.php
class AdminConteudoController extends Controller
{
    public function __construct(private ConteudoService $servico) {}

    public function index(): JsonResponse
    {
        $conteudos = Conteudo::orderByDesc('created_at')->paginate(30);
        return response()->json($conteudos);
    }

    public function store(CriarConteudoRequest $request): JsonResponse
    {
        $conteudo = $this->servico->criar($request->validated());
        return response()->json(['conteudo' => new ConteudoResource($conteudo)], 201);
    }

    public function update(AtualizarConteudoRequest $request, Conteudo $conteudo): JsonResponse
    {
        $atualizado = $this->servico->atualizar($conteudo, $request->validated());
        return response()->json(['conteudo' => new ConteudoResource($atualizado)]);
    }

    public function destroy(Conteudo $conteudo): JsonResponse
    {
        // Soft delete — apenas despublica, não apaga do banco
        $this->servico->despublicar($conteudo);
        return response()->json(['sucesso' => true]);
    }
}
```

```php
// routes/api.php — adições do Módulo 3
Route::middleware('auth:sanctum')->group(function () {
    // Biblioteca — assinantes
    Route::get('/biblioteca',        [BibliotecaController::class, 'index']);
    Route::get('/biblioteca/{slug}', [ConteudoController::class, 'show']);

    // Biblioteca — admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/conteudos',              [AdminConteudoController::class, 'index']);
        Route::post('/conteudos',             [AdminConteudoController::class, 'store']);
        Route::patch('/conteudos/{conteudo}', [AdminConteudoController::class, 'update']);
        Route::delete('/conteudos/{conteudo}',[AdminConteudoController::class, 'destroy']);
    });
});
```

---

## 6. Endpoints da API

| Método | Path | Auth | Params | Response |
|--------|------|------|--------|----------|
| GET | `/api/biblioteca` | Sanctum (qualquer role) | `q`, `tipo`, `regiao`, `de`, `ate`, `cursor`, `limite` | `{ itens: ConteudoCard[], next_cursor, has_more }` |
| GET | `/api/biblioteca/{slug}` | Sanctum (qualquer role) | — | `{ conteudo: Conteudo }` ou 404 |
| GET | `/api/admin/conteudos` | Sanctum + role `admin` | `page` | Paginação Laravel padrão |
| POST | `/api/admin/conteudos` | Sanctum + role `admin` | Body JSON | `{ conteudo: Conteudo }` 201 |
| PATCH | `/api/admin/conteudos/{id}` | Sanctum + role `admin` | Body JSON parcial | `{ conteudo: Conteudo }` |
| DELETE | `/api/admin/conteudos/{id}` | Sanctum + role `admin` | — | `{ sucesso: true }` |

### Response: ConteudoCard (listagem)
```json
{
  "id": 42,
  "tipo": "briefing",
  "titulo": "Tensão no Mar Vermelho ameaça rotas de exportação brasileiras",
  "slug": "tensao-mar-vermelho-1713089400",
  "resumo": "Ataques Houthi intensificam-se, seguradora marítima eleva prêmios...",
  "regiao": "Oriente Médio",
  "tags": ["alimentos", "logística"],
  "tese_manchete": null,
  "plano_minimo": "essencial",
  "publicado_em": "2026-04-14T08:00:00Z"
}
```

### Response: Conteudo (leitura completa)
```json
{
  "id": 42,
  "tipo": "briefing",
  "titulo": "Tensão no Mar Vermelho ameaça rotas de exportação brasileiras",
  "slug": "tensao-mar-vermelho-1713089400",
  "corpo": "<h2>Contexto</h2><p>...</p>",
  "resumo": "...",
  "regiao": "Oriente Médio",
  "tags": ["alimentos", "logística"],
  "tese_manchete": null,
  "plano_minimo": "essencial",
  "publicado_em": "2026-04-14T08:00:00Z"
}
```

---

## 7. Frontend React

### 7.1 Estrutura de Componentes e Páginas

```
src/
├── pages/
│   ├── dashboard/
│   │   ├── Biblioteca.tsx            ← listagem com busca e filtros
│   │   └── ConteudoLeitura.tsx       ← leitura individual (/dashboard/biblioteca/:slug)
│   └── admin/
│       ├── AdminBiblioteca.tsx       ← listagem de conteúdos (admin)
│       └── AdminNovoConteudo.tsx     ← formulário de publicação (admin)
├── components/
│   ├── biblioteca/
│   │   ├── ContentCard.tsx           ← card na listagem
│   │   ├── ContentReader.tsx         ← renderização do HTML do TipTap
│   │   ├── SearchBar.tsx             ← campo de busca com debounce 500ms
│   │   ├── FilterBar.tsx             ← selects de tipo, período e região
│   │   └── PlanGate.tsx              ← bloqueio quando plano insuficiente
│   └── admin/
│       └── AdminEditor.tsx           ← editor TipTap com barra de formatação
├── hooks/
│   ├── useBiblioteca.ts              ← React Query (listagem infinita com cursor)
│   └── useConteudo.ts                ← React Query (leitura individual)
└── types/
    └── biblioteca.ts                 ← interfaces TypeScript
```

### 7.2 Componentes Principais

**ContentCard** — exibe:
- Badge de tipo com cor: `briefing` → azul | `mapa` → amarelo | `tese` → dourado `#c9b882`
- Data de publicação (ex.: "14 abr 2026")
- Região (quando disponível)
- Título (hover: cor `#c9b882`)
- `tese_manchete` em itálico dourado (apenas para A Tese)
- Resumo em `text-white/40`

**FilterBar** — controles:
- Select: Todos os tipos / Briefing Diário / Mapa da Semana / A Tese
- Date inputs: "De" e "Até"
- Text input: Região (debounce 500ms)
- Botão "Limpar filtros" (visível apenas quando algum filtro está ativo)

**SearchBar** — campo de texto com debounce de 500ms antes de disparar a query.

**ContentReader** — renderiza o HTML do TipTap com Tailwind Typography:
```tsx
<div
  className="prose prose-invert prose-sm max-w-none
             prose-headings:font-serif prose-headings:text-[#f0ece2]
             prose-p:text-[#e8e4dc]/70 prose-p:leading-relaxed
             prose-strong:text-[#e8e4dc] prose-hr:border-[#c9b882]/20"
  dangerouslySetInnerHTML={{ __html: conteudo.corpo }}
/>
```

**PlanGate** — exibido quando `GET /api/biblioteca/:slug` retorna 404 por restrição de plano:
- Título: "Este conteúdo é exclusivo do plano [Pro/Reservado]"
- Subtítulo: "Faça upgrade para acessar o arquivo completo."
- Botão CTA: "Ver planos" (link para `#planos`)

**AdminEditor** — editor TipTap com barra de formatação:
- Botões: **N** (negrito), _I_ (itálico), H2 (título), — (divisor horizontal)
- `onUpdate` dispara `onChange(editor.getHTML())` para o formulário pai
- Área de edição com `min-h-[360px]`, tema escuro

### 7.3 Fluxo do Usuário — Assinante
1. Navega para `/dashboard/biblioteca`
2. Vê listagem filtrada automaticamente pelo próprio role (restrição aplicada no backend)
3. Digita no campo de busca → debounce 500ms → re-query com `?q=termo`
4. Aplica filtros combinados → React Query re-busca automaticamente
5. Scroll chega ao fim → botão "Carregar mais" → query com `cursor`
6. Clica em um card → navega para `/dashboard/biblioteca/:slug`
7. Página de leitura renderiza o HTML do TipTap com estilos corretos
8. Se plano insuficiente → 404 do backend → exibe `PlanGate`

### 7.4 Fluxo do Usuário — Administrador
1. Acessa `/admin/biblioteca` (protegido por role `admin`)
2. Vê listagem de todos os conteúdos (publicados + rascunhos)
3. Clica em "Nova publicação" → vai para `/admin/novo-conteudo`
4. Seleciona tipo, cola o texto no `AdminEditor`, preenche metadados
5. Para A Tese: preenche também o campo "Em uma frase" (`tese_manchete`)
6. Seleciona plano mínimo de acesso
7. Clica em "Publicar agora" ou "Salvar rascunho"
8. Conteúdo aparece imediatamente na Biblioteca para assinantes elegíveis

### 7.5 Campos do Formulário Admin

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Tipo | Select | Briefing Diário / Mapa da Semana / A Tese |
| Título | Text | Gera o slug automaticamente |
| Conteúdo | TipTap | Rich text: negrito, itálico, H2, divisores |
| Resumo | Textarea | Máx. 200 chars — exibido na listagem |
| Região | Text | Região geopolítica principal |
| Tags | Text | Tags separadas por vírgula |
| Em uma frase | Text | Apenas para A Tese — `tese_manchete` |
| Plano mínimo | Select | Essencial / Pro / Reservado |
| Publicar agora | Toggle | Publica imediatamente ou salva como rascunho |

---

## 8. Agendamentos (Laravel Scheduler)

O Módulo 3 não adiciona novos agendamentos automáticos. Todo o conteúdo é publicado manualmente pelo administrador. O scheduler existente do Módulo 1 não é alterado.

---

## 9. Jobs e Queues

O Módulo 3 não possui jobs assíncronos. A publicação é uma operação síncrona de escrita simples no banco.

**Exceção futura (Fase 2):** Job de geração de sumário automático via Claude API ao publicar novos conteúdos.

---

## 10. Controle de Acesso (Spatie Roles)

| Role | Tipo de Conteúdo Visível | Período Histórico |
|------|--------------------------|-------------------|
| `assinante_essencial` | Apenas `briefing` com `plano_minimo = essencial` | Últimos 90 dias |
| `assinante_pro` | `briefing`, `mapa`, `tese` com `plano_minimo` em `['essencial', 'pro']` | Últimos 90 dias |
| `assinante_reservado` | Todo o arquivo sem filtro de plano | Histórico completo |
| `admin` | Todo o arquivo + rascunhos | Histórico completo |

**Policy de acesso:**
```php
// app/Policies/ConteudoPolicy.php
class ConteudoPolicy
{
    public function view(User $user, Conteudo $conteudo): bool
    {
        if ($user->hasRole('admin') || $user->hasRole('assinante_reservado')) {
            return $conteudo->publicado;
        }

        $planosPermitidos = $user->hasRole('assinante_pro')
            ? ['essencial', 'pro']
            : ['essencial'];

        $tiposPermitidos = $user->hasRole('assinante_pro')
            ? ['briefing', 'mapa', 'tese']
            : ['briefing'];

        return $conteudo->publicado
            && in_array($conteudo->plano_minimo, $planosPermitidos)
            && in_array($conteudo->tipo, $tiposPermitidos)
            && $conteudo->publicado_em >= now()->subDays(90);
    }
}
```

---

## 11. Error Handling

| Cenário | Tratamento |
|---------|-----------|
| Conteúdo não encontrado (`slug` inválido) | HTTP 404 com mensagem padronizada |
| Plano insuficiente para o conteúdo | HTTP 404 (não revela que existe — mesma resposta do 404 comum) |
| Slug duplicado na criação | `gerarSlug()` acrescenta timestamp, garantindo unicidade |
| Corpo HTML muito grande (> 1MB) | Validação no `CriarConteudoRequest` com `max:1000000` |
| Admin tenta editar conteúdo inexistente | HTTP 404 via route model binding do Laravel |
| Busca full-text com caracteres especiais | Sanitização no `ConteudoService` antes do `MATCH AGAINST` |
| Role ausente no usuário | Fallback para `assinante_essencial` (acesso mínimo) |
| Requisição `DELETE` em conteúdo não encontrado | HTTP 404 via route model binding |

---

## 12. Checklist de Entrega

### Banco de Dados
- [ ] Tabela `conteudos` criada com todos os campos e índices
- [ ] Índice `FULLTEXT` em `titulo, corpo` funcionando (testar com `MATCH AGAINST`)
- [ ] Coluna `slug` com constraint `UNIQUE`
- [ ] Seeder de conteúdo de teste: 1 briefing, 1 mapa, 1 tese para cada plano

### API Laravel
- [ ] `GET /api/biblioteca` retornando com busca full-text funcionando
- [ ] Filtros por tipo, região e período funcionando (isolados e combinados)
- [ ] Paginação cursor-based retornando `next_cursor` quando há mais itens
- [ ] `GET /api/biblioteca/:slug` retornando conteúdo completo com corpo HTML
- [ ] Restrição por plano: `assinante_essencial` não vê `mapa` nem `tese`
- [ ] Restrição de histórico: `assinante_essencial` e `assinante_pro` limitados a 90 dias
- [ ] `assinante_reservado` vê histórico completo sem limite de data
- [ ] `POST /api/admin/conteudos` criando publicação com slug único
- [ ] `PATCH /api/admin/conteudos/:id` editando e publicando rascunhos
- [ ] `DELETE` retornando 200 e despublicando sem apagar do banco
- [ ] HTTP 403 ao tentar acessar `/api/admin/*` sem role `admin`

### Painel Admin
- [ ] Rota `/admin/biblioteca` acessível apenas ao role `admin`
- [ ] Editor TipTap renderizando com barra de formatação (N, I, H2, —)
- [ ] Formulário enviando e criando conteúdo no banco
- [ ] Toggle "Publicar agora" definindo `publicado_em` corretamente
- [ ] Campo "Em uma frase" visível apenas ao selecionar tipo "tese"
- [ ] Listagem de rascunhos e publicados em `/admin/biblioteca`
- [ ] Edição de conteúdo existente (PATCH) funcionando

### Interface da Biblioteca
- [ ] Listagem exibindo conteúdo correto por plano do assinante autenticado
- [ ] Campo de busca com debounce de 500ms disparando full-text search
- [ ] Filtros de tipo, período e região funcionando combinados
- [ ] Botão "Limpar filtros" visível apenas quando filtros estão ativos
- [ ] Botão "Carregar mais" funcionando com cursor
- [ ] `ContentCard` exibindo badge de tipo com cor correta
- [ ] `tese_manchete` em itálico dourado no card de A Tese
- [ ] Página de leitura renderizando HTML do TipTap com estilos corretos
- [ ] `PlanGate` exibido quando assinante não tem acesso (404 do backend)
- [ ] Link "Biblioteca" adicionado à `TopNav` do dashboard

### Integração e Testes
- [ ] Teste completo por plano: `assinante_essencial` vê apenas briefings (últimos 90 dias)
- [ ] Teste completo por plano: `assinante_pro` vê briefings + mapa + tese (últimos 90 dias)
- [ ] Teste completo por plano: `assinante_reservado` vê tudo sem limite de data
- [ ] Admin consegue criar, editar e despublicar conteúdo
- [ ] Busca full-text retornando resultados relevantes em português
