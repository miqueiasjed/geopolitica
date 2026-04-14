# Tasks do Plano 5 – Feed de Tensões: Frontend (M01)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 5.1 | Types, hook useFeed e serviço api.ts | frontend-componente | ✅ | média |
| 5.2 | Componentes ImpactBadge e EventCard | frontend-componente | ✅ | média |
| 5.3 | Componentes FilterBar e EventList com scroll infinito | frontend-componente | ✅ | média |
| 5.4 | Layout DashboardLayout, TopNav e página Feed | frontend-pagina | ✅ | média |
| 5.5 | Indicador de atualização e polimento visual | frontend-componente | ✅ | baixa |

## Ordem de execução
5.1 → 5.2 → 5.3 → 5.4 → 5.5

## Dependências internas
- 5.2 depende de 5.1 (precisa dos types `Event` e `ImpactLabel`)
- 5.3 depende de 5.1 e 5.2 (usa useFeed e EventCard)
- 5.4 depende de 5.1, 5.2 e 5.3 (monta todos os componentes)
- 5.5 depende de 5.4 (polimento da página já montada)
