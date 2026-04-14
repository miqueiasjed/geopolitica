# Tasks do Plano 13 – Radar de Eleições (M08)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 13.1 | Migration, Model Eleicao e Seeder (~15 eleições de 2026) | backend-estrutura | ⏳ | baixa |
| 13.2 | EleicaoController, EleicaoAdminController, Requests, rotas e cache | backend-endpoint | ⏳ | média |
| 13.3 | Types, Hook useEleicoes e EleicaoFilterBar | frontend-componente | ⏳ | baixa |
| 13.4 | RadarGrid e EleicaoCard | frontend-componente | ⏳ | média |
| 13.5 | EleicaoDetailPanel, AdminEleicaoForm, RadarEleicoes page e TopNav | frontend-pagina | ⏳ | alta |

## Ordem de execução
13.1 → 13.2 → 13.3 → 13.4 → 13.5

## Dependências internas
- 13.2 depende de 13.1 (precisa do Model `Eleicao`)
- 13.3 independente do backend (pode iniciar em paralelo com 13.1)
- 13.4 depende de 13.3 (precisa dos types e hook)
- 13.5 depende de 13.3 e 13.4 (precisa dos hooks e componentes visuais)
