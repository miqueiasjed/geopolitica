# Tasks do Plano 23 – Relatório Personalizado por IA (M15)

> Gerado em: 2026-04-27

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 23.1 | Migrations: relatorios_ia e uso_relatorios | backend-estrutura | ⏳ | baixa |
| 23.2 | Models: RelatorioIa e UsoRelatorio | backend-estrutura | ⏳ | baixa |
| 23.3 | RelatorioIaService: limite, contexto, geração e persistência | backend-logica | ⏳ | alta |
| 23.4 | RelatorioIaController e rotas da API | backend-endpoint | ⏳ | baixa |
| 23.5 | Hook useGerarRelatorio: consumer SSE com preview em tempo real | frontend-componente | ⏳ | média |
| 23.6 | Página NovoRelatorio: formulário e preview em streaming | frontend-pagina | ⏳ | média |
| 23.7 | Página RelatoriosIA (histórico), rotas e navegação | frontend-pagina | ⏳ | média |

## Ordem de execução
23.1 → 23.2 → 23.3 → 23.4 → 23.5 → 23.6 → 23.7

## Dependências internas
- 23.2 depende de 23.1 (tabelas devem existir antes dos models)
- 23.3 depende de 23.2 (usa os models RelatorioIa e UsoRelatorio)
- 23.4 depende de 23.3 (usa o RelatorioIaService)
- 23.5 é independente do backend (pode ser feita em paralelo com 23.4)
- 23.6 depende de 23.5 (usa o hook) e de 22.6 (usa ExportPdfButton)
- 23.7 depende de 23.6 (importa NovoRelatorio) e de 23.4 (endpoint `/api/relatorios` pronto)
