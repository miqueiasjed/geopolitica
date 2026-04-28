# Tasks do Plano 21 – Monitor Eleitoral e Monitor de Guerra (Frontend + Backend)

> Gerado em: 2026-04-27

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 21.1 | Backend: endpoint GET /api/war-feed e filtro vertical em conteudos | backend-endpoint | ✅ | média |
| 21.2 | Admin: campo vertical_conteudo no formulário de conteúdo | frontend-componente | ✅ | baixa |
| 21.3 | Hook useAddonAccess e componente AddonGate | frontend-componente | ✅ | baixa |
| 21.4 | Página MonitorEleitoral | frontend-pagina | ✅ | média |
| 21.5 | Página MonitorGuerra | frontend-pagina | ✅ | média |
| 21.6 | Navegação condicional e rotas protegidas | frontend-componente | ✅ | baixa |

## Ordem de execução
21.1 → 21.2 → 21.3 → 21.4 → 21.5 → 21.6

## Dependências internas
- 21.1 depende do Plano 19 (Gate acessar-vertical deve existir)
- 21.3 depende de 21.2 apenas logicamente (pode ser feito em paralelo)
- 21.4 depende de 21.1 (endpoint conteudos com filtro vertical) e 21.3 (useAddonAccess + AddonGate)
- 21.5 depende de 21.1 (endpoint war-feed) e 21.3 (useAddonAccess + AddonGate)
- 21.6 depende de 21.3 (useAddonAccess), 21.4 e 21.5 (páginas devem existir)
