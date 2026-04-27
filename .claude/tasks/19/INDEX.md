# Tasks do Plano 19 – Add-ons: Banco de Dados e Serviço Central

> Gerado em: 2026-04-27

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 19.1 | Migrations: addons em assinantes, tabela assinante_addons e vertical_conteudo | backend-estrutura | ✅ | baixa |
| 19.2 | Model AssinanteAddon e atualização do Model Assinante | backend-estrutura | ✅ | baixa |
| 19.3 | Config de produtos add-on e AddonService (ativar/cancelar) | backend-logica | ✅ | média |
| 19.4 | Atualizar HotmartHandlerService para detectar add-ons e Gate de acesso | backend-logica | ✅ | média |
| 19.5 | Testes: AddonService e HotmartHandlerService com add-ons | teste | ✅ | média |

## Ordem de execução
19.1 → 19.2 → 19.3 → 19.4 → 19.5

## Dependências internas
- 19.2 depende de 19.1 (tabela assinante_addons deve existir)
- 19.3 depende de 19.2 (usa Model Assinante e AssinanteAddon)
- 19.4 depende de 19.3 (usa AddonService)
- 19.5 depende de 19.3 e 19.4 (testa AddonService e HotmartHandlerService atualizados)
