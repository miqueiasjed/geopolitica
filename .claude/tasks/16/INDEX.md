# Tasks do Plano 16 – Admin IA v2: Descrições Enriquecidas e Restaurar Padrão

> Gerado em: 2026-04-21

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 16.1 | Enriquecer metadados dos 6 prompts no ConfiguracaoService | backend-logica | ⏳ | baixa |
| 16.2 | Endpoint GET /api/admin/configuracoes/defaults | backend-endpoint | ⏳ | baixa |
| 16.3 | Tipos TypeScript e UI de metadados estruturados nos prompts | frontend-componente | ⏳ | baixa |
| 16.4 | Botão "↺ Restaurar padrão" com fetch e feedback visual | frontend-componente | ⏳ | média |

## Ordem de execução
16.1 → 16.2 → 16.3 → 16.4

## Dependências internas
- 16.2 é independente de 16.1 (pode ser feita em paralelo)
- 16.3 depende de 16.1 (precisa dos novos campos na resposta da API)
- 16.4 depende de 16.2 (precisa do endpoint de defaults) e de 16.3 (precisa dos tipos atualizados)
