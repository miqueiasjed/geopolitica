# Tasks do Plano 11 – Perfil de País (M06)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|--------------|
| 11.1 | Migrations e Models: PerfilPais e PaisUsuario | backend-estrutura | ⏳ | baixa |
| 11.2 | PaisesInicialSeeder: 20 países com termos_busca e indicadores | backend-estrutura | ⏳ | baixa |
| 11.3 | GeradorPerfilPaisService, EventosPaisService, Job e Command | backend-logica | ⏳ | alta |
| 11.4 | PaisController, PaisUsuarioController, Request e Rotas | backend-endpoint | ⏳ | média |
| 11.5 | Types e Hooks: useMeusPaises, usePerfilPais, useEventosPais | frontend-componente | ⏳ | baixa |
| 11.6 | BuscaPais, CardPais e MeusPaisesPage | frontend-pagina | ⏳ | média |
| 11.7 | PerfilPaisPage, integração WorldMap e navegação | frontend-pagina | ⏳ | alta |

## Ordem de execução
11.1 → 11.2 → 11.3 → 11.4 → 11.5 → 11.6 → 11.7

## Dependências internas
- 11.2 depende de 11.1 (precisa da tabela `perfis_paises` criada)
- 11.3 depende de 11.1 (precisa dos Models `PerfilPais`)
- 11.4 depende de 11.1 e 11.3 (precisa dos Models e Services)
- 11.5 independente do backend (pode iniciar em paralelo com 11.3)
- 11.6 depende de 11.5 (precisa dos hooks)
- 11.7 depende de 11.5 e 11.6 (precisa dos hooks e dos componentes base)
