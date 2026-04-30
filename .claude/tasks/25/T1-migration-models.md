# T1 – Migration + Models: planos e plano_recursos

## Objetivo
Criar as tabelas `planos` e `plano_recursos` no banco de dados e os respectivos Models Eloquent.

## Arquivos a criar

### Migration: `2026_04_29_000001_create_planos_table.php`
Localização: `backend/database/migrations/`

Tabela `planos`:
- `id` bigIncrements
- `slug` string(50) unique — 'essencial', 'pro', 'reservado'
- `nome` string(100)
- `descricao` text nullable
- `preco` decimal(10,2) default 0
- `ordem` unsignedSmallInteger default 0
- `ativo` boolean default true
- `timestamps`

Tabela `plano_recursos`:
- `id` bigIncrements
- `plano_id` foreignId constrained('planos') cascadeOnDelete
- `chave` string(100) — nome do recurso (ex: 'chat_diario_limite')
- `valor` string(255) nullable — null = ilimitado/não se aplica; 'true'/'false' para booleans; número como string para limites
- `ativo` boolean default true
- `timestamps`
- unique(['plano_id', 'chave'])

### Model: `backend/app/Models/Plano.php`
- Namespace: `App\Models`
- fillable: `slug`, `nome`, `descricao`, `preco`, `ordem`, `ativo`
- cast: `ativo` → boolean, `preco` → decimal:2, `ordem` → integer
- HasMany: `recursos()` → PlanoRecurso
- Scope: `scopeAtivos($query)` — where ativo = true
- Método helper: `recurso(string $chave): ?PlanoRecurso` — retorna o recurso pelo chave

### Model: `backend/app/Models/PlanoRecurso.php`
- Namespace: `App\Models`
- fillable: `plano_id`, `chave`, `valor`, `ativo`
- cast: `ativo` → boolean
- BelongsTo: `plano()` → Plano
- Método helper: `valorBoolean(): bool` — retorna `$this->valor === 'true'`
- Método helper: `valorInteiro(): ?int` — retorna (int) $this->valor se não nulo, null se nulo

## Regras
- Seguir padrões da skill laravel-arquitetura
- Models NUNCA contêm lógica de negócio — apenas accessors e helpers simples
- Código em português conforme o projeto
