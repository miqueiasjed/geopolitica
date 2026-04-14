# Tasks do Plano 14 – Chat com os Briefings (M09)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 14.1 | Migrations e Models: ChatSessao e ChatMensagem | backend-estrutura | ⏳ | baixa |
| 14.2 | ChatRecuperacaoService: busca FULLTEXT nas 4 fontes | backend-logica | ⏳ | média |
| 14.3 | ChatService (streaming SSE + limite Redis) + Controllers + Rotas | backend-logica | ⏳ | alta |
| 14.4 | Types, Hook useChat e serviço chatApi (SSE) | frontend-componente | ⏳ | alta |
| 14.5 | ChatInput, ChatMessage, ChatMessages, ChatLimitWarning e ChatBriefings page | frontend-pagina | ⏳ | alta |

## Ordem de execução
14.1 → 14.2 → 14.3 → 14.4 → 14.5

## Dependências internas
- 14.2 depende de 14.1 (precisa dos Models para referência, usa tabelas de outros planos)
- 14.3 depende de 14.1 e 14.2 (precisa dos Models e do ChatRecuperacaoService)
- 14.4 independente do backend (pode iniciar em paralelo com 14.2)
- 14.5 depende de 14.4 (precisa do hook useChat e dos types)
