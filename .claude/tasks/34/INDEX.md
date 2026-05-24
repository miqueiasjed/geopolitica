# Tasks do Plano 34 – Mobile: Subscriber Pages (Refinamento)

> Gerado em: 2026-05-23

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 34.1 | MapaPage Mobile: touch-action e container responsivo | frontend-pagina | ⏳ | baixa |
| 34.2 | TimelinePage Mobile: scroll horizontal ou lista vertical | frontend-pagina | ⏳ | média |
| 34.3 | RiskScorePage Mobile: gráficos responsivos e tabela com overflow | frontend-pagina | ⏳ | baixa |
| 34.4 | EleicaoPage (assinante): EleicaoDetailPanel como drawer em mobile | frontend-pagina | ⏳ | média |
| 34.5 | MonitorGuerraPage e MonitorEleitoralPage: painel lateral empilhado em mobile | frontend-pagina | ⏳ | baixa |
| 34.6 | ChatPage Mobile: uma tela por vez (lista OU chat ativo) | frontend-pagina | ⏳ | média |
| 34.7 | BibliotecaPage (assinante) e RelatoriosPage: filtros e grid responsivos | frontend-pagina | ⏳ | baixa |
| 34.8 | PaisPage Mobile: seções de gráficos empilhadas | frontend-pagina | ⏳ | baixa |

## Ordem de execução
As tasks 34.1–34.8 são independentes entre si (páginas diferentes) e podem ser executadas em paralelo.

Ordem recomendada por complexidade (mais simples primeiro):
34.1 → 34.3 → 34.5 → 34.7 → 34.8 → 34.2 → 34.4 → 34.6

## Dependências internas
- Todas dependem do Plano 31 ✅ (unificação de roles).
- 34.4 depende de entender `EleicaoDetailPanel.tsx` (ver contexto antes de modificar).
- 34.6 (ChatPage) é a task de maior impacto UX — reservar para quando há mais contexto disponível.
