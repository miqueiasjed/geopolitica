# Tasks do Plano 7 – Biblioteca de Conteúdo: Backend (M03)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 7.1 | Migration, Model Conteudo e Seeder | backend-estrutura | ✅ | média |
| 7.2 | ConteudoService e ConteudoPolicy | backend-logica | ✅ | alta |
| 7.3 | FormRequests e Resources | backend-logica | ✅ | baixa |
| 7.4 | BibliotecaController e ConteudoController (endpoints públicos) | backend-endpoint | ✅ | média |
| 7.5 | AdminConteudoController (CRUD admin) | backend-endpoint | ✅ | média |

## Ordem de execução
7.1 → 7.2 → 7.3 → 7.4 → 7.5

## Dependências internas
- 7.2 depende de 7.1 (precisa do Model `Conteudo` e seus scopes)
- 7.3 depende de 7.1 (precisa dos campos do Model para validação e Resources)
- 7.4 depende de 7.2 e 7.3 (precisa do Service e dos FormRequests/Resources)
- 7.5 depende de 7.2 e 7.3 (precisa do Service e dos FormRequests/Resources)
