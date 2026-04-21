# Tasks do Plano 17 – Admin IA v2: Modo de Teste de Prompt (F4)

> Gerado em: 2026-04-21

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 17.1 | AiTestService: lógica de execução do teste de prompt | backend-logica | ⏳ | baixa |
| 17.2 | AdminAiTestController + FormRequest + Rota + Rate Limit | backend-endpoint | ⏳ | média |
| 17.3 | Tipos TypeScript + hook useTestarPrompt | frontend-componente | ⏳ | baixa |
| 17.4 | Componente PromptTestPanel (colapsável, formulário, resultado, validação JSON) | frontend-componente | ⏳ | alta |
| 17.5 | Integrar PromptTestPanel na página de configurações de IA | frontend-pagina | ⏳ | baixa |

## Ordem de execução
17.1 → 17.2 → 17.3 → 17.4 → 17.5

## Dependências internas
- 17.2 depende de 17.1 (precisa do AiTestService)
- 17.3 é independente do backend (pode ser desenvolvida em paralelo com 17.1/17.2)
- 17.4 depende de 17.3 (precisa do hook e tipos)
- 17.5 depende de 17.4 (precisa do componente PromptTestPanel)
