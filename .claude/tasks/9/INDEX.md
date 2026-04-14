# Tasks do Plano 9 – Indicadores de Risco (M04)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 9.1 | Migrations, Models e Seeder de Indicadores | backend-estrutura | ⏳ | baixa |
| 9.2 | MarketFetcherService, IndicadoresService, Job e Scheduler | backend-logica | ⏳ | alta |
| 9.3 | IndicadoresController, HistoricoController e Rotas | backend-endpoint | ⏳ | baixa |
| 9.4 | Types, Hooks e IndicatorCard | frontend-componente | ⏳ | média |
| 9.5 | IndicatorsBar e integração no DashboardLayout | frontend-componente | ⏳ | média |

## Ordem de execução
9.1 → 9.2 → 9.3 → 9.4 → 9.5

## Dependências internas
- 9.2 depende de 9.1 (precisa dos Models `Indicador` e `IndicadorHistorico`)
- 9.3 depende de 9.2 (precisa do `IndicadoresService` com `listarComCache()` e `historicoPorSimbolo()`)
- 9.4 independente do backend (pode ser desenvolvido em paralelo após 9.1)
- 9.5 depende de 9.4 (precisa do `IndicatorCard` e dos hooks)
