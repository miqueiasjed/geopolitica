# Tasks do Plano 31 – Unificação de Role de Assinante

> Gerado em: 2026-05-23

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 31.1 | Migration de Unificação de Roles + RolesSeeder | backend-estrutura | ⏳ | média |
| 31.2 | Refactor HotmartHandlerService + LastlinkHandlerService | backend-logica | ⏳ | média |
| 31.3 | Refactor ImportacaoAssinantesService + TrocarPlanoAssinanteJob + ImportarAddonsJob | backend-logica | ⏳ | média |
| 31.4 | Refactor AdminAssinanteService + EntregaAlertaService | backend-logica | ⏳ | baixa |
| 31.5 | Refactor AdminUsuarioController + AdminPlanoController | backend-endpoint | ⏳ | média |
| 31.6 | Refactor AdminAssinanteAddonController + FormRequests | backend-endpoint | ⏳ | baixa |
| 31.7 | Atualizar Commands + DadosProducaoFakeSeeder | backend-logica | ⏳ | baixa |
| 31.8 | Testes Webhook/Admin (HotmartHandlerTest + WebhookLastlinkTest + AdminHotmartTest) | teste | ⏳ | baixa |
| 31.9 | Testes Auth/Feed/Perfil (FeedTest + PerfilTest + AuthTest) | teste | ⏳ | baixa |
| 31.10 | Frontend: AdminUsuarios — Badge de Plano Separado da Role | frontend-pagina | ⏳ | baixa |
| 31.11 | Frontend: AdminPlanos — Remover Coluna Role + Reformular PainelRecursos | frontend-pagina | ⏳ | média |

## Ordem de execução

```
31.1 → 31.2 → 31.3 → 31.4 → 31.5 → 31.6 → 31.7 → 31.8 → 31.9 → 31.10 → 31.11
```

## Dependências internas

- **31.2** depende de **31.1** (roles devem existir no banco antes de refatorar os handlers)
- **31.3** depende de **31.1** (idem)
- **31.4** depende de **31.1** (idem)
- **31.5** depende de **31.1** (idem)
- **31.6** depende de **31.5** (FormRequests devem refletir as mudanças do controller)
- **31.7** pode rodar após **31.1** (independente das tasks 2–6)
- **31.8** depende de **31.2** (testa os handlers refatorados)
- **31.9** depende de **31.4, 31.5** (testa serviços e controllers refatorados)
- **31.10** depende de **31.5** (o endpoint de usuários deve retornar `assinante.plano`)
- **31.11** independente de backend (apenas remove coluna Role e reformula UI)

## Paralelizável (após 31.1):
- **31.2, 31.3, 31.4, 31.5, 31.7** podem rodar em paralelo (todas dependem apenas de 31.1)
- **31.10, 31.11** podem rodar em paralelo entre si (ambas são frontend)
