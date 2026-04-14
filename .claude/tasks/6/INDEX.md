# Tasks do Plano 6 – Mapa de Calor Geopolítico (M02)

> Gerado em: 2026-04-14

## Legenda
- ✅ Concluída
- 🔄 Em andamento
- ⏳ Pendente

## Tasks

| # | Título | Tipo | Status | Complexidade |
|---|--------|------|--------|-------------|
| 6.1 | Migration gdelt_cache, View SQL mapa_intensidade e Model | backend-estrutura | ✅ | baixa |
| 6.2 | GdeltFetcherService, MapaIntensidadeService, Job e Scheduler | backend-logica | ✅ | alta |
| 6.3 | MapaIntensidadeController e RegiaoEventosController | backend-endpoint | ✅ | baixa |
| 6.4 | Frontend: types, hooks useMapaIntensidade e useRegiaoEventos | frontend-componente | ✅ | baixa |
| 6.5 | Componente WorldMap com escala de cores e interação | frontend-componente | ✅ | alta |
| 6.6 | RegionPanel animado e página Mapa | frontend-pagina | ✅ | média |

## Ordem de execução
6.1 → 6.2 → 6.3 → 6.4 → 6.5 → 6.6

## Dependências internas
- 6.2 depende de 6.1 (precisa do Model GdeltCache e da view)
- 6.3 depende de 6.1 e 6.2 (precisa do service e da view para os endpoints)
- 6.4 é independente do backend (pode rodar em paralelo com 6.2 e 6.3)
- 6.5 depende de 6.4 (precisa dos types e hooks)
- 6.6 depende de 6.4 e 6.5 (monta todos os componentes)
