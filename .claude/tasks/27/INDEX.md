# Tasks do Plano 27 – Multi-Produtos: Backend Gestão Manual de Addons

> Gerado em: 2026-05-18

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 27.1 | Instalar maatwebsite/excel + Criar ImportarAddonsJob | backend-estrutura | ⏳ | baixa |
| 27.2 | FormRequests AdicionarAddonRequest e AtualizarAddonRequest | backend-logica | ⏳ | baixa |
| 27.3 | AdminAssinanteAddonController (GET list + POST adicionar) + Rotas | backend-endpoint | ⏳ | média |
| 27.4 | AdminAssinanteAddonController (PUT editar + DELETE remover) | backend-endpoint | ⏳ | média |
| 27.5 | Endpoint Importar Addons (POST /admin/assinantes/addons/importar) | backend-endpoint | ⏳ | alta |
| 27.6 | Endpoint Exportar Addons (GET /admin/assinantes/addons/exportar) | backend-endpoint | ⏳ | baixa |

## Ordem de execução
27.1 → 27.2 → 27.3 → 27.4 → 27.5 → 27.6

## Dependências internas
- 27.2 precede 27.3 (FormRequests são injetados no controller)
- 27.3 precede 27.4 (adiciona métodos ao controller criado)
- 27.5 depende de 27.1 (usa ImportarAddonsJob) e 27.4 (modifica o mesmo controller)
- 27.6 depende de 27.5 (adiciona mais um método ao controller)

## Dependências externas
- Requer Plano 26 concluído (tabela `produtos` para validar `addon_key` no FormRequest)
