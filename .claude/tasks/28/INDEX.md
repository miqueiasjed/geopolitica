# Tasks do Plano 28 – Multi-Produtos: Frontend Core

> Gerado em: 2026-05-18

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 28.1 | Tipos TypeScript: produto.ts | frontend-componente | ⏳ | baixa |
| 28.2 | Services: adminProdutos.ts + adminAssinanteAddons.ts | frontend-componente | ⏳ | baixa |
| 28.3 | Hook useProdutos.ts com helper resolveLinkCta | frontend-componente | ⏳ | baixa |
| 28.4 | Atualizar useAddonAccess.ts para delegar ao useProdutos | frontend-componente | ⏳ | baixa |
| 28.5 | Reescrever AddonGate.tsx com CTA dinâmico por status | frontend-componente | ⏳ | média |
| 28.6 | Ajustar TopNav + MonitorEleitoral + MonitorGuerra | frontend-componente | ⏳ | baixa |

## Ordem de execução
28.1 → 28.2 → 28.3 → 28.4 → 28.5 → 28.6

## Dependências internas
- 28.2 depende de 28.1 (importa tipos criados)
- 28.3 depende de 28.1 (importa `Produto`, `StatusAddonUsuario`)
- 28.4 depende de 28.3 (usa `useProdutos`)
- 28.5 depende de 28.3 e 28.4 (usa hook e helpers)
- 28.6 depende de 28.5 (usa prop `chave` do `AddonGate` reescrito)

## Dependências externas
- Requer Plano 26 concluído (endpoint `/api/meus-produtos` deve existir)
