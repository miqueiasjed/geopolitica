# Tasks do Plano 15 – Licenciamento B2B (M11)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 15.1 | Infraestrutura: wildcard DNS, SSL e Nginx multi-subdomínio | config | ⏳ | média |
| 15.2 | Migrations, Models, Seeder de roles B2B e IdentificarTenantMiddleware | backend-estrutura | ⏳ | média |
| 15.3 | LicencaB2BService, MembroB2BService, convite por e-mail e Scheduler | backend-logica | ⏳ | alta |
| 15.4 | EmpresaController, AdminB2BController e rotas | backend-endpoint | ⏳ | média |
| 15.5 | TenantContext, DashboardLayout B2B, TeamPanel, MembersList e InviteMemberModal | frontend-componente | ⏳ | alta |
| 15.6 | AdminB2BPage, AceitarConvitePage, EquipePage e rotas | frontend-pagina | ⏳ | média |

## Ordem de execução
15.1 → 15.2 → 15.3 → 15.4 → 15.5 → 15.6

## Dependências internas
- 15.2 depende de 15.1 (variáveis de ambiente e config do domain)
- 15.3 depende de 15.2 (precisa dos Models e Middleware)
- 15.4 depende de 15.2 e 15.3 (precisa dos Models e Services)
- 15.5 independente do backend em grande parte (pode iniciar em paralelo com 15.3)
- 15.6 depende de 15.5 (precisa do TeamPanel e outros componentes)
