# Tasks do Plano 29 – Multi-Produtos: Frontend Admin UI

> Gerado em: 2026-05-18

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 29.1 | AdminProdutos.tsx (tabela de listagem) | frontend-pagina | ⏳ | média |
| 29.2 | AdminProdutos.tsx: Modal Criar/Editar Produto | frontend-pagina | ⏳ | média |
| 29.3 | AdminAssinanteAddons.tsx | frontend-pagina | ⏳ | alta |
| 29.4 | AdminImportarAddons.tsx (upload + preview + template) | frontend-pagina | ⏳ | média |
| 29.5 | AdminImportarAddons.tsx: relatório pós-importação | frontend-pagina | ⏳ | baixa |
| 29.6 | Router admin + Sidebar: rotas e links de navegação | frontend-componente | ⏳ | baixa |
| 29.7 | Polimento visual e estados de loading/erro globais | frontend-pagina | ⏳ | baixa |

## Ordem de execução
29.1 → 29.2 → 29.3 → 29.4 → 29.5 → 29.6 → 29.7

## Dependências internas
- 29.2 depende de 29.1 (adiciona modal à página existente)
- 29.4 e 29.3 são independentes entre si (podem ser desenvolvidas em paralelo após 29.2)
- 29.5 depende de 29.4 (adiciona relatório à página existente)
- 29.6 depende de 29.1, 29.3 e 29.4 (registra páginas no router)
- 29.7 depende de todas anteriores (polimento final)

## Dependências externas
- Requer Plano 27 concluído (endpoints de addons e importação)
- Requer Plano 28 concluído (services e tipos TS já criados)
