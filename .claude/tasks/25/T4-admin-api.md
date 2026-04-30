# T4 – Admin API: AdminPlanoController + FormRequests + Rotas

## Objetivo
Criar os endpoints REST para o admin gerenciar planos e seus recursos via API.

## Dependência
T2 deve estar concluída (`PlanoService` já existe).

## Arquivos a criar

### Service methods para admin em `PlanoService`
Adicionar ao `PlanoService` existente os métodos de escrita:
```php
// Retorna todos os planos com seus recursos
public function todos(): Collection

// Atualiza um recurso específico de um plano
public function atualizarRecurso(int $planoId, string $chave, ?string $valor, bool $ativo): PlanoRecurso

// Atualiza metadados de um plano (nome, descricao, preco)
public function atualizarPlano(int $planoId, array $dados): Plano
```
Após cada escrita, chamar `$this->invalidarCache($slugPlano)`.

### FormRequest: `backend/app/Http/Requests/Admin/AtualizarPlanoRecursoRequest.php`
Validações:
- `valor` → nullable|string|max:255
- `ativo` → required|boolean

### FormRequest: `backend/app/Http/Requests/Admin/AtualizarPlanoRequest.php`
Validações:
- `nome` → required|string|max:100
- `descricao` → nullable|string|max:1000
- `preco` → required|numeric|min:0

### Controller: `backend/app/Http/Controllers/Api/Admin/AdminPlanoController.php`
Namespace: `App\Http\Controllers\Api\Admin`

Endpoints:
```php
// GET /admin/planos → lista todos os planos com seus recursos
public function index(): JsonResponse

// PUT /admin/planos/{plano} → atualiza metadados do plano
public function update(AtualizarPlanoRequest $request, Plano $plano): JsonResponse

// PUT /admin/planos/{plano}/recursos/{chave} → atualiza um recurso específico
public function atualizarRecurso(AtualizarPlanoRecursoRequest $request, Plano $plano, string $chave): JsonResponse
```

Resposta do `index()`:
```json
{
  "data": [
    {
      "id": 1,
      "slug": "essencial",
      "nome": "Essencial",
      "descricao": null,
      "preco": "0.00",
      "ordem": 1,
      "ativo": true,
      "recursos": {
        "chat_diario_limite": { "valor": "5", "ativo": true },
        "relatorio_mensal_limite": { "valor": "2", "ativo": true },
        ...
      }
    },
    ...
  ]
}
```

### Rotas (`backend/routes/api.php`)
Dentro do grupo `middleware(['auth:sanctum', 'role:admin'])->prefix('admin')`, adicionar:
```php
Route::get('/planos', [AdminPlanoController::class, 'index']);
Route::put('/planos/{plano}', [AdminPlanoController::class, 'update']);
Route::put('/planos/{plano}/recursos/{chave}', [AdminPlanoController::class, 'atualizarRecurso']);
```

## Regras
- Seguir padrões da skill laravel-arquitetura
- Controller FINO: apenas delega para PlanoService
- FormRequests dedicados para cada tipo de atualização
- Importar `AdminPlanoController` no `api.php`
- Código em português
