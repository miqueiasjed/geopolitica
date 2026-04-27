# Tasks do Plano 20 – Webhook Lastlink e E-mail de Boas-vindas do Add-on

> Gerado em: 2026-04-27

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 20.1 | WebhookLastlinkController, FormRequest e rota | backend-endpoint | ✅ | baixa |
| 20.2 | LastlinkHandlerService: registrarEvento e handleCompra | backend-logica | ✅ | média |
| 20.3 | LastlinkHandlerService: handleCancelamento + AddonBoasVindasMail | backend-logica | ✅ | média |
| 20.4 | Testes de feature: Webhook Lastlink | teste | ✅ | média |

## Ordem de execução
20.1 → 20.2 → 20.3 → 20.4

## Dependências internas
- 20.1 depende do Plano 19 completo (AddonService deve existir)
- 20.2 depende de 20.1 (controller e rota devem existir)
- 20.3 depende de 20.2 (completa o LastlinkHandlerService)
- 20.4 depende de 20.1, 20.2, 20.3 (testa o fluxo completo)
