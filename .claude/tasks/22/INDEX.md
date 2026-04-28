# Tasks do Plano 22 – Exportação para PDF (M14)

> Gerado em: 2026-04-27

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 22.1 | Instalar e configurar barryvdh/laravel-dompdf | config | ⏳ | baixa |
| 22.2 | Blade templates PDF: layout base, briefing e alerta | backend-estrutura | ⏳ | média |
| 22.3 | Blade templates PDF: perfil de país e chat | backend-estrutura | ⏳ | média |
| 22.4 | PdfTemplateService: busca de dados e geração do PDF | backend-logica | ⏳ | média |
| 22.5 | ExportPdfController e rota POST /api/export-pdf | backend-endpoint | ⏳ | baixa |
| 22.6 | Componente React ExportPdfButton | frontend-componente | ⏳ | baixa |
| 22.7 | Integrar ExportPdfButton nas páginas existentes | frontend-pagina | ⏳ | baixa |

## Ordem de execução
22.1 → 22.2 → 22.3 → 22.4 → 22.5 → 22.6 → 22.7

## Dependências internas
- 22.2 e 22.3 dependem de 22.1 (diretório `resources/views/pdf/` criado)
- 22.4 depende de 22.2 e 22.3 (usa os templates Blade)
- 22.5 depende de 22.4 (usa o PdfTemplateService)
- 22.6 é independente (pode ser feita após 22.1)
- 22.7 depende de 22.5 e 22.6 (endpoint e componente prontos)
