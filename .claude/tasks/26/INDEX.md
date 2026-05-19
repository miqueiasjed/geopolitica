# Tasks do Plano 26 – Multi-Produtos: Backend Core

> Gerado em: 2026-05-18

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 26.1 | Migration e Model Produto | backend-estrutura | ⏳ | baixa |
| 26.2 | ProdutoSeeder + DatabaseSeeder + AssinanteAddon::FONTES | backend-estrutura | ⏳ | baixa |
| 26.3 | MeusProdutosController + Rota GET /api/meus-produtos | backend-endpoint | ⏳ | média |
| 26.4 | FormRequests CriarProdutoRequest e AtualizarProdutoRequest | backend-logica | ⏳ | baixa |
| 26.5 | AdminProdutoController (index, store, update) + Rotas Admin | backend-endpoint | ⏳ | média |
| 26.6 | AdminProdutoController destroy com proteção 422 | backend-endpoint | ⏳ | baixa |

## Ordem de execução
26.1 → 26.2 → 26.4 → 26.3 → 26.5 → 26.6

## Dependências internas
- 26.2 depende de 26.1 (precisa do Model Produto para o seeder)
- 26.3 depende de 26.1 e 26.2 (usa Model + dados semeados)
- 26.4 precede 26.5 (FormRequests são injetados no controller)
- 26.5 depende de 26.4 (usa os dois FormRequests)
- 26.6 depende de 26.5 (adiciona método no controller já criado)
