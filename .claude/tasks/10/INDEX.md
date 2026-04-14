# Tasks do Plano 10 – Alerta Preditivo (M05)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 10.1 | Migrations e Models do Sistema de Alertas | backend-estrutura | ⏳ | média |
| 10.2 | DetectorSinaisService (integração Claude API) | backend-logica | ⏳ | alta |
| 10.3 | AnalisadorConvergenciaService, EntregaAlertaService e Jobs | backend-logica | ⏳ | alta |
| 10.4 | AlertaController, AlertaPreditivoService e Rotas | backend-endpoint | ⏳ | média |
| 10.5 | Mailable, Blade template e configuração de ambiente | backend-logica | ⏳ | baixa |
| 10.6 | Types, Hooks e AlertaBadge | frontend-componente | ⏳ | média |
| 10.7 | AlertaPanel e integração na TopNav | frontend-componente | ⏳ | alta |

## Ordem de execução
10.1 → 10.2 → 10.3 → 10.4 → 10.5 → 10.6 → 10.7

## Dependências internas
- 10.2 depende de 10.1 (precisa dos Models `SinalPadrao` e `AlertaPreditivo`)
- 10.3 depende de 10.1 e 10.2 (precisa dos Models e entende fluxo de detecção)
- 10.4 depende de 10.1 (precisa dos scopes do `AlertaPreditivo`)
- 10.5 depende de 10.1 (precisa do Model `AlertaPreditivo` para o Mailable)
- 10.6 independente do backend (pode iniciar em paralelo com 10.3)
- 10.7 depende de 10.6 (precisa dos hooks e do `AlertaBadge`)
