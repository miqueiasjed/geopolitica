# Tasks do Plano 4 – Feed de Tensões: Backend (M01)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 4.1 | Migrations Sources e Events com índices | backend-estrutura | ✅ | baixa |
| 4.2 | SourcesSeeder e RssFetcherService | backend-logica | ✅ | média |
| 4.3 | AiAnalyzerService (análise Claude API em lotes) | backend-logica | ✅ | alta |
| 4.4 | FeedUpdaterService, Job e Scheduler | backend-logica | ✅ | média |
| 4.5 | FeedController, EventResource e rotas com controle por role | backend-endpoint | ✅ | média |
| 4.6 | Error handling global e testes do pipeline | teste | ✅ | média |

## Ordem de execução
4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6

## Dependências internas
- 4.2 depende de 4.1 (precisa dos Models Source e Event)
- 4.3 depende de 4.1 (precisa do Model Event para saber os campos esperados)
- 4.4 depende de 4.2 e 4.3 (orquestra os dois services)
- 4.5 depende de 4.1 e 4.4 (precisa do Model e do Job)
- 4.6 depende de 4.3, 4.4 e 4.5 (testa tudo que foi criado)
