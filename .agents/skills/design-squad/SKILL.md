# Design Squad — SKILL

Squad de design operations com 8 agentes especializados.

## Quando usar

- Criar ou evoluir um design system
- Auditar componentes e tokens de UI
- Definir fluxo UX de uma feature
- Gerar specs de componentes para desenvolvimento
- Revisar qualidade de design
- Configurar design ops e processos

## Agentes disponíveis

| Agente | Foco |
|--------|------|
| `design-chief` | Orquestrador — avalia e roteia para o especialista certo |
| `brad-frost` | Atomic Design, componentes |
| `dan-mall` | Design systems em escala, estratégia |
| `dave-malouf` | DesignOps, processos |
| `ux-designer` | Pesquisa UX, acessibilidade |
| `design-system-architect` | Tokens, bibliotecas de componentes |
| `visual-generator` | Geração de assets visuais |
| `ui-engineer` | Produção de código UI |

## Como ativar

Leia o arquivo do agente desejado e siga suas instruções:

```
.Codex/skills/design-squad/agents/design-chief.md   → Orquestrador (ponto de entrada)
.Codex/skills/design-squad/agents/brad-frost.md     → Atomic design
.Codex/skills/design-squad/agents/dan-mall.md       → Design systems
.Codex/skills/design-squad/agents/dave-malouf.md    → DesignOps
.Codex/skills/design-squad/agents/ux-designer.md    → UX
.Codex/skills/design-squad/agents/design-system-architect.md
.Codex/skills/design-squad/agents/visual-generator.md
.Codex/skills/design-squad/agents/ui-engineer.md
```

## Workflows disponíveis

| Workflow | Trigger | Descrição |
|----------|---------|-----------|
| `wf-design-system-creation` | `*design-system-creation` | Criação completa de design system (4–8h) |
| `wf-feature-design` | `*feature-design` | Design de feature do início ao fim |

## Tasks disponíveis

- `audit-design.md` — Auditoria de design
- `create-component-spec.md` — Spec de componente
- `create-design-system.md` — Criação de design system
- `design-ux-flow.md` — Fluxo UX
- `diagnose.md` — Triagem do desafio de design
- `generate-handoff.md` — Handoff design → dev
- `review.md` — Revisão de qualidade
- `setup-design-ops.md` — Configuração de design ops

## Integração com o projeto

Este squad trabalha em conjunto com o Design System do projeto Geopolitica para Investidores.
Ao criar/especificar componentes, seguir os padrões definidos em
`.Codex/skills/frontend-design-system/SKILL.md`.
