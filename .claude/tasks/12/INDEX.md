# Tasks do Plano 12 – Linha do Tempo de Crises (M07)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 12.1 | Migration, Model CriseHistorica e Seeder (~25 crises) | backend-estrutura | ⏳ | média |
| 12.2 | TimelineController, TimelineDetailController, rotas e cache Redis | backend-endpoint | ⏳ | baixa |
| 12.3 | Types e Hooks: useTimeline e useCriseDetalhe | frontend-componente | ⏳ | baixa |
| 12.4 | TimelineBar, CriseMarker e EventoMarker | frontend-componente | ⏳ | alta |
| 12.5 | CriseDetailPanel, EventoDetailPanel, Timeline page e TopNav | frontend-pagina | ⏳ | alta |

## Ordem de execução
12.1 → 12.2 → 12.3 → 12.4 → 12.5

## Dependências internas
- 12.2 depende de 12.1 (precisa do Model `CriseHistorica` e dados do seeder)
- 12.3 independente do backend (pode iniciar em paralelo com 12.1)
- 12.4 depende de 12.3 (precisa dos types e hooks)
- 12.5 depende de 12.3 e 12.4 (precisa dos hooks e dos componentes visuais)
