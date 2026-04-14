---
name: create-plans
description: Lê um PRD/SRS e gera planos numerados em .claude/plans/, atualizando o INDEX.md automaticamente.
---
# Skill: Criar Planos a partir do PRD

Esta skill transforma um documento de requisitos (PRD/SRS) em planos de desenvolvimento organizados, prontos para serem executados pela skill `run-plan`.

---

## 🛑 REGRA DE OURO: Economia de Contexto

- Cada plano gerado deve ser **autocontido**: conter apenas o contexto mínimo necessário para ser executado, sem depender da leitura do PRD inteiro.
- **NUNCA copie trechos longos do PRD** para dentro do plano. Resuma e referencie.
- Se o PRD for muito grande, fragmente-o primeiro (ver Passo 0).

---

## Passo 0 – Fragmentar o PRD (se necessário)

Se o PRD tiver mais de **2.000 linhas** ou cobrir **5+ módulos distintos**:

1. Crie a pasta `.claude/prd/` (se não existir).
2. Extraia cada módulo/domínio para um arquivo separado:
   ```
   .claude/prd/
     agendamentos.md
     professores.md
     planos-assinatura.md
     avaliacoes.md
     painel-admin.md
   ```
3. Cada fragmento deve conter:
   - Regras de negócio do módulo.
   - Modelos/entidades envolvidas.
   - Fluxos de usuário relevantes.
4. O PRD original permanece como referência, mas a IA passa a consultar apenas os fragmentos.

---

## Passo 1 – Leitura e Análise do PRD

1. Leia o PRD completo (ou os fragmentos em `.claude/prd/`).
2. Leia `.claude/plans/INDEX.md` para saber quais planos já existem e qual é o próximo número disponível.
3. Leia `.claude/rules.md` (se existir) para respeitar restrições do projeto.

---

## Passo 2 – Identificar Módulos e Dependências

Analise o PRD e identifique:

- **Módulos funcionais** (ex: Agendamentos, Professores, Pagamentos).
- **Dependências entre módulos** (ex: Agendamentos depende de Professores e Planos).
- **Prioridade natural** (módulos base antes de módulos dependentes).

Organize os módulos em uma **ordem de execução lógica**:
1. Infraestrutura e setup (migrations, seeders base).
2. Módulos independentes (sem dependências externas).
3. Módulos dependentes (na ordem das dependências).
4. Integrações e refinamentos.
5. Testes end-to-end e polimento.

---

## Passo 3 – Gerar os Planos

Para cada módulo identificado, crie um arquivo `.claude/plans/[N].md` com esta estrutura:

```markdown
# Plano [N] – [Nome descritivo do módulo]

## Objetivo
[1-2 frases explicando o que este plano entrega ao final]

## Contexto de Negócio
[Resumo das regras de negócio relevantes – máximo 10-15 linhas]
[Se o PRD foi fragmentado: "Detalhes completos em: `.claude/prd/[modulo].md`"]

## Escopo

### Inclui
- [Funcionalidade A]
- [Funcionalidade B]
- [Funcionalidade C]

### Não inclui (fica para outro plano)
- [Funcionalidade X → ver Plano M]

## Dependências
- **Requer concluído:** Plano [X] – [nome]
- **Bloqueia:** Plano [Y] – [nome]

## Entidades/Models envolvidos
- [Model A] – [breve descrição]
- [Model B] – [breve descrição]

## Entregáveis esperados
- [ ] [Entregável 1]
- [ ] [Entregável 2]
- [ ] [Entregável 3]

## Estimativa de tasks
~[N] tasks (backend: ~X, frontend: ~Y, testes: ~Z)

## Skills necessárias
- [lista de skills relevantes para este plano]
```

### Regras ao gerar planos:

- **Granularidade correta:** Um plano deve ser grande o suficiente para representar um módulo coerente, mas pequeno o suficiente para ser completado em **3-8 tasks**.
- **Se um módulo for muito grande** (ex: geraria 15+ tasks), divida em sub-planos:
  - `Plano 5 – Agendamentos: Backend (CRUD + regras)`
  - `Plano 6 – Agendamentos: Frontend (páginas + componentes)`
  - `Plano 7 – Agendamentos: Integrações e testes E2E`
- **Nunca gere planos vagos** como "Melhorias gerais" ou "Ajustes diversos".
- **Cada plano deve ser executável de forma independente** (respeitando as dependências declaradas).

---

## Passo 4 – Atualizar o INDEX.md

Após gerar todos os planos, atualize (ou crie) `.claude/plans/INDEX.md`:

```markdown
# INDEX – Planos do Projeto Geopolitica para Investidores

> Última atualização: [DATA]

## Legenda
- ✅ Concluído
- 🔄 Em andamento
- ⏳ Pendente
- 🔒 Bloqueado (dependência não concluída)

## Planos

| # | Nome | Status | Depende de | Tasks |
|---|------|--------|------------|-------|
| 1 | Setup e Infraestrutura Base | ⏳ | — | ~4 |
| 2 | Módulo de Usuários e Auth | ⏳ | 1 | ~5 |
| 3 | Módulo de Professores | ⏳ | 2 | ~6 |
| ... | ... | ... | ... | ... |

## Ordem de execução recomendada
1 → 2 → 3 → 4/5 (paralelos) → 6 → ...
```

---

## Passo 5 – Validação Final

Antes de finalizar, verifique:

- [ ] Todos os requisitos do PRD estão cobertos por pelo menos um plano?
- [ ] As dependências formam um grafo sem ciclos?
- [ ] Nenhum plano tem mais de 8 tasks estimadas?
- [ ] O INDEX.md reflete todos os planos gerados?
- [ ] Os planos seguem a ordem lógica de dependências?

Se algum requisito ficou órfão, crie um plano para ele ou incorpore em um existente.

---

## Exemplo de uso

O usuário diz: _"Leia o PRD e crie os planos"_ ou _"create-plans"_.

A IA deve:
1. Ler o PRD (ou fragmentos).
2. Ler o INDEX.md atual.
3. Gerar os planos em `.claude/plans/`.
4. Atualizar o INDEX.md.
5. Informar ao usuário o que foi criado e a ordem recomendada.