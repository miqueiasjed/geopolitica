---
name: laravel-arquitetura
description: Padrões estritos de arquitetura Laravel para o projeto Geopolitica para Investidores. Define o uso de Controllers, Services, FormRequests e outras regras.
---
# Skill: Arquitetura Laravel – Geopolitica para Investidores

Você está trabalhando em um projeto Laravel com regras estritas de arquitetura.

## Regras essenciais

### 1. Controllers
- Devem ser **finos**.
- Não devem conter:
  - lógica de negócio,
  - cálculos,
  - validações complexas,
  - regras de permissão além de middlewares.
- Papel do controller: orquestrar → chamar Service → retornar resposta.

### 2. Services
- Toda regra de negócio deve ficar em Services.
- Services ficam em `App\Services`.
- Sempre recebem Models ou DTOs, nunca fazem `Auth::user()` internamente.
- Devem retornar:
  - arrays padronizados (`success`, `message`, `data`)
  - ou objetos Result.
- Services devem ser testáveis e independentes do framework.

### 3. Validação
- Toda validação obrigatoriamente vai para:
  - **FormRequests dedicados** em `App\Http\Requests`.
- Nunca usar `Request->validate()` em controllers.
- Para validações específicas:
  - Regras customizadas (`Rule` classes).
  - `prepareForValidation()` para normalização.

### 4. Models (Eloquent)
- Model NUNCA contém regras de negócio.
- Permitido:
  - Accessors
  - Mutators
  - Scopes (`scopeAtivos`, `scopeDoUsuario`)
  - Regras próprias da entidade (ex: `isAtivo`)
- Proibido:
  - Processos complexos
  - Lógica que mistura domínio com infraestrutura

### 5. Middlewares
- Sempre que existir checagem repetitiva → criar middleware dedicado.
- Controllers assumem que o contexto já foi garantido.

### 6. Idioma
- Todo código do projeto deve ser escrito em **português**:
  - nomes de variáveis,
  - métodos,
  - classes,
  - services,
  - middlewares,
  - helpers.
- Somente nomes técnicos do Laravel podem permanecer em inglês (`mount`, `render`, `Service`, `Controller`, etc.).

## Ordem mental obrigatória (Codex deve seguir)
1. Isso é regra de negócio? → **Service**.  
2. É validação? → **FormRequest**.  
3. É autorização? → **Spatie Permission**.  
4. É checagem repetitiva? → **Middleware**.

---

Use este skill sempre que gerar código Laravel, criar endpoints, services, validações ou organizar estrutura de diretórios.
