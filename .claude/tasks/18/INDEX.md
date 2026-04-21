# Tasks do Plano 18 – Admin IA v2: Painel de Uso da IA (F3)

> Gerado em: 2026-04-21

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 18.1 | Migration ai_logs + Model AiLog com cálculo de custo estimado | backend-estrutura | ⏳ | baixa |
| 18.2 | Integrar logging fire-and-forget nos providers ClaudeProvider e OpenAiProvider | backend-logica | ⏳ | média |
| 18.3 | Command LimparAiLogsAntigos + agendamento no Kernel | backend-logica | ⏳ | baixa |
| 18.4 | AdminAiUsoController + endpoint GET /api/admin/ai/uso + rota | backend-endpoint | ⏳ | média |
| 18.5 | Tipos TypeScript + hook useAiUso | frontend-componente | ⏳ | baixa |
| 18.6 | Página /admin/ia/uso: cards de resumo + tabela de breakdown | frontend-pagina | ⏳ | alta |
| 18.7 | Gráfico de barras 7 dias CSS puro + badge provider ativo | frontend-componente | ⏳ | média |

## Ordem de execução
18.1 → 18.2 → 18.3 → 18.4 → 18.5 → 18.6 → 18.7

## Dependências internas
- 18.2 depende de 18.1 (precisa do model AiLog)
- 18.3 depende de 18.1 (precisa do model AiLog)
- 18.4 depende de 18.1 (precisa do model AiLog para queries)
- 18.5 é independente do backend (pode ser feita em paralelo com 18.1–18.4)
- 18.6 depende de 18.5 (precisa do hook e tipos)
- 18.7 depende de 18.5 (precisa dos tipos) e deve ser integrada em 18.6

## Paralelizável
- 18.2, 18.3, 18.4 podem ser feitas em paralelo (todas dependem apenas de 18.1)
- 18.5 pode ser feita em paralelo com 18.1–18.4
