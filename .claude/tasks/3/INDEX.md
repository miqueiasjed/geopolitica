# Tasks do Plano 3 – Integração Hotmart (M10)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 3.1 | Migration e Model WebhookEvento | backend-estrutura | ✅ | baixa |
| 3.2 | HotmartHandlerService: handlers para cada tipo de evento | backend-logica | ✅ | alta |
| 3.3 | WebhookHotmartController e rota pública | backend-endpoint | ✅ | média |
| 3.4 | Templates Blade de e-mail (4 templates) | backend-logica | ✅ | média |
| 3.5 | Frontend admin: AdminAssinantes e AdminWebhookEventos | frontend-pagina | ✅ | alta |

## Ordem de execução
3.1 → 3.2 → 3.3 → 3.4 → 3.5

## Dependências internas
- 3.2 depende de 3.1 (precisa do Model WebhookEvento)
- 3.3 depende de 3.1 e 3.2 (precisa do Model e do Service)
- 3.4 depende de 3.2 (Mailables são chamados pelo HotmartHandlerService)
- 3.5 depende de 3.3 (precisa dos endpoints admin funcionando)
