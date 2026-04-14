# Tasks do Plano 8 – Biblioteca de Conteúdo: Frontend (M03)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 8.1 | Types e Hooks da Biblioteca | frontend-componente | ⏳ | média |
| 8.2 | ContentCard e PlanGate | frontend-componente | ⏳ | média |
| 8.3 | SearchBar, FilterBar e ContentReader | frontend-componente | ⏳ | média |
| 8.4 | Páginas Biblioteca e ConteudoLeitura | frontend-pagina | ⏳ | alta |
| 8.5 | AdminEditor (TipTap) e AdminNovoConteudo | frontend-pagina | ⏳ | alta |
| 8.6 | AdminBiblioteca, rotas admin e link na TopNav | frontend-pagina | ⏳ | média |

## Ordem de execução
8.1 → 8.2 → 8.3 → 8.4 → 8.5 → 8.6

## Dependências internas
- 8.2 depende de 8.1 (precisa dos tipos `ConteudoCard` e `TipoConteudo`)
- 8.3 depende de 8.1 (precisa de `BibliotecaFiltros`)
- 8.4 depende de 8.1, 8.2 e 8.3 (usa hooks e todos os componentes de suporte)
- 8.5 depende de 8.1 (usa tipos e contexto admin)
- 8.6 depende de 8.4 e 8.5 (referencia as páginas nas rotas)
