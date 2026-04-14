---
name: create-tasks
description: Lê um plano em .Codex/plans/[N].md e gera tasks granulares em .Codex/tasks/[N]/, otimizadas para não exceder o limite de tokens.
---
# Skill: Criar Tasks a partir de um Plano

Esta skill transforma um plano de desenvolvimento em tasks granulares, prontas para execução individual pela skill `run-plan`.

---

## 🛑 REGRA CRÍTICA: Limite de Tokens por Task

Cada task deve ser projetada para ser **executável dentro de ~20.000-25.000 tokens de output** (código gerado + testes). Isso garante que o agente consiga completar a task inteira dentro do limite de 80k tokens da conversa (considerando leitura de contexto + execução + testes).

### Indicadores de que uma task está grande demais:
- Cria/modifica **mais de 3 arquivos**.
- Envolve **mais de 150 linhas de código novo**.
- Mistura **backend + frontend** na mesma task.
- Exige ler **mais de 5 arquivos existentes** para contexto.

Se qualquer indicador for verdadeiro → **quebre em tasks menores**.

---

## Passo 1 – Leitura do Plano

1. Receba o número do plano (ex: `create-tasks 5` ou "crie as tasks do plano 5").
2. Leia o arquivo `.Codex/plans/[N].md`.
3. Leia `.Codex/rules.md` e o `AGENTS.md` para relembrar as convenções.
4. Se o plano referencia um fragmento do PRD (ex: `.Codex/prd/agendamentos.md`), leia-o.

---

## Passo 2 – Decompor em Tasks

Analise os entregáveis do plano e decomponha seguindo esta **hierarquia de granularidade**:

### Camada 1: Backend – Estrutura
- Migrations e Models (1 task por entidade ou grupo pequeno de entidades relacionadas).
- Seeders e dados iniciais (1 task se simples, ou separada).

### Camada 2: Backend – Lógica
- Service + regras de negócio (1 task por Service ou por grupo de métodos coesos).
- FormRequests de validação (pode agrupar com o endpoint correspondente se simples).

### Camada 3: Backend – Endpoints
- Controller + rotas + middleware (1 task por recurso/CRUD ou por ação complexa).
- Permissões Spatie (incluir na task do endpoint ou separar se houver muitas).

### Camada 4: Frontend – Páginas (React + Vite + TypeScript)
- Página/componente principal (1 task por página).
- Componentes reutilizáveis (1 task por componente complexo).
- Integrações com API via TanStack Query (pode agrupar com a página se simples).

### Camada 5: Testes e Validação
- Testes do Service (1 task).
- Testes de endpoint/integração (1 task).
- Teste E2E do fluxo completo (1 task se necessário).

### Regras de agrupamento:
- **Pode agrupar** na mesma task: FormRequest + Controller + Rota (se o endpoint for simples).
- **Nunca agrupar**: Backend (Laravel) + Frontend (React) na mesma task.
- **Nunca agrupar**: Lógica de domínio (Service) com criação de UI.
- **Sempre separar**: Migrations/Models em task própria (são a base de tudo).

---

## Passo 3 – Gerar os Arquivos de Task

Crie a pasta `.Codex/tasks/[N]/` e gere um arquivo por task.

### Nomenclatura dos arquivos:
```
.Codex/tasks/[N]/
  [N].1.md    ← primeira task
  [N].2.md    ← segunda task
  [N].3.md    ← terceira task
  ...
```

### Template de cada task:

```markdown
# Task [N].[X] – [Título curto e descritivo]

## Objetivo
[1-2 frases: o que esta task entrega quando concluída]

## Tipo
[backend-estrutura | backend-logica | backend-endpoint | frontend-pagina | frontend-componente | teste | config]

## Arquivos a criar/modificar
- `caminho/do/arquivo1.php` → [criar | modificar]
- `caminho/do/arquivo2.tsx` → [criar | modificar]

## Contexto necessário (arquivos para ler antes)
- `caminho/do/arquivo_existente.php` → [motivo: ex "entender interface do Service"]
- `caminho/do/outro.ts` → [motivo: ex "ver tipos já definidos"]

## Skills necessárias
- [laravel-arquitetura | frontend-design-system | permissoes-e-sync | datas-timezone]

## Especificação

### O que fazer:
[Instruções claras e diretas do que implementar]

### Regras de negócio aplicáveis:
- [Regra 1]
- [Regra 2]

### Critérios de aceitação:
- [ ] [Critério verificável 1]
- [ ] [Critério verificável 2]
- [ ] [Critério verificável 3]

## Teste esperado
[Como validar que esta task está completa]
- Comando(s) de teste: `php artisan test --filter=NomeDoTeste`
- Verificação manual: [se aplicável]

## Estimativa de complexidade
[baixa | média | alta]
~[N] linhas de código | ~[N] arquivos
```

---

## Passo 4 – Criar Arquivo de Índice das Tasks

Crie (ou atualize) `.Codex/tasks/[N]/INDEX.md`:

```markdown
# Tasks do Plano [N] – [Nome do Plano]

> Gerado em: [DATA]

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| [N].1 | [Título] | backend-estrutura | ⏳ | baixa |
| [N].2 | [Título] | backend-logica | ⏳ | média |
| [N].3 | [Título] | backend-endpoint | ⏳ | média |
| [N].4 | [Título] | frontend-pagina | ⏳ | alta |
| [N].5 | [Título] | teste | ⏳ | baixa |

## Ordem de execução
[N].1 → [N].2 → [N].3 → [N].4 → [N].5

## Dependências internas
- [N].3 depende de [N].1 e [N].2 (precisa do Model e do Service)
- [N].4 depende de [N].3 (precisa dos endpoints prontos)
```

---

## Passo 5 – Atualizar o INDEX.md do Plano

Atualize `.Codex/plans/INDEX.md` preenchendo a coluna "Tasks" com o número real de tasks geradas.

---

## Passo 6 – Validação Final

Antes de finalizar, verifique:

- [ ] Nenhuma task cria/modifica mais de 3 arquivos?
- [ ] Nenhuma task mistura backend com frontend?
- [ ] Todas as tasks têm "Contexto necessário" preenchido?
- [ ] Todas as tasks têm "Critérios de aceitação" claros?
- [ ] A ordem de execução respeita as dependências?
- [ ] Todos os entregáveis do plano estão cobertos pelas tasks?
- [ ] Cada task é executável de forma independente (dado que as anteriores foram concluídas)?

---

## Exemplo de uso

O usuário diz: _"Crie as tasks do plano 5"_ ou _"create-tasks 5"_.

A IA deve:
1. Ler `.Codex/plans/5.md`.
2. Decompor em tasks granulares.
3. Criar os arquivos em `.Codex/tasks/5/`.
4. Criar o INDEX.md das tasks.
5. Atualizar o INDEX.md dos planos.
6. Informar ao usuário quantas tasks foram criadas e a ordem de execução.

---

## Dica: Execução em lote

Para gerar tasks de TODOS os planos pendentes de uma vez:

1. Leia `.Codex/plans/INDEX.md`.
2. Para cada plano com status ⏳ que ainda não tem pasta em `.Codex/tasks/`:
   - Execute esta skill.
3. **Atenção ao limite de contexto:** se houver muitos planos, gere as tasks de **no máximo 3 planos por conversa** para evitar degradação de qualidade.