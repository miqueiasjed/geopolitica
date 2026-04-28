# Tasks do Plano 24 – Risk Score de Portfólio (M16)

> Gerado em: 2026-04-27

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 24.1 | Migrations: mapa_risco_ativos e carteiras | backend-estrutura | ⏳ | baixa |
| 24.2 | Models: MapaRiscoAtivo e Carteira | backend-estrutura | ⏳ | baixa |
| 24.3 | Seeder MapaRiscoAtivosSeeder com 40+ ativos pré-mapeados | backend-estrutura | ⏳ | baixa |
| 24.4 | RiskScoreService: motor de cálculo e mapeamento por IA | backend-logica | ⏳ | alta |
| 24.5 | CarteiraRiscoController e rotas da API | backend-endpoint | ⏳ | baixa |
| 24.6 | Componente ScoreGauge: gauge de risco por categoria | frontend-componente | ⏳ | baixa |
| 24.7 | Página RiskScore: formulário de ativos e exibição do score | frontend-pagina | ⏳ | alta |
| 24.8 | Rota, navegação condicional e AddonGate para Risk Score | frontend-pagina | ⏳ | baixa |
| 24.9 | Template PDF do Risk Score e suporte no PdfTemplateService | backend-estrutura | ⏳ | média |

## Ordem de execução
24.1 → 24.2 → 24.3 → 24.4 → 24.5 → 24.6 → 24.7 → 24.8 → 24.9

## Dependências internas
- 24.2 depende de 24.1 (tabelas devem existir)
- 24.3 depende de 24.2 (usa o Model MapaRiscoAtivo)
- 24.4 depende de 24.2 (usa Models) e 24.3 (ativos iniciais para testar)
- 24.5 depende de 24.4 (usa RiskScoreService)
- 24.6 é independente (pode ser feita em paralelo com 24.5)
- 24.7 depende de 24.5 (endpoint pronto), 24.6 (ScoreGauge) e 22.6 (ExportPdfButton)
- 24.8 depende de 24.7 (página RiskScore existente)
- 24.9 depende de 24.4 (RiskScoreService) e 22.2/22.4 (layout PDF e PdfTemplateService)
