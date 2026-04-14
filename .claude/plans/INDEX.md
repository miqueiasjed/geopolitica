# INDEX – Planos do Projeto Geopolítica para Investidores

> Última atualização: 2026-04-14 (Plano 13 concluído)

## Legenda
- ✅ Concluído
- 🔄 Em andamento
- ⏳ Pendente
- 🔒 Bloqueado (dependência não concluída)

## Planos

| # | Nome | Status | Depende de | Tasks |
|---|------|--------|------------|-------|
| 1 | [Setup e Infraestrutura Base](1.md) | ✅ | — | 4 |
| 2 | [Autenticação e Controle de Acesso (M00)](2.md) | ✅ | 1 | 6 |
| 3 | [Integração Hotmart (M10)](3.md) | ✅ | 2 | 5 |
| 4 | [Feed de Tensões: Backend (M01)](4.md) | ✅ | 2 | 6 |
| 5 | [Feed de Tensões: Frontend (M01)](5.md) | ✅ | 4 | 5 |
| 6 | [Mapa de Calor Geopolítico (M02)](6.md) | ✅ | 4 | 6 |
| 7 | [Biblioteca de Conteúdo: Backend (M03)](7.md) | ✅ | 2 | 5 |
| 8 | [Biblioteca de Conteúdo: Frontend (M03)](8.md) | ✅ | 7 | 6 |
| 9 | [Indicadores de Risco (M04)](9.md) | ✅ | 2, 5 | 5 |
| 10 | [Alerta Preditivo (M05)](10.md) | ⏳ | 4, 7, 9 | 7 |
| 11 | [Perfil de País (M06)](11.md) | ⏳ | 4, 6, 7, 9 | 7 |
| 12 | [Linha do Tempo de Crises (M07)](12.md) | ✅ | 4, 7 | 5 |
| 13 | [Radar de Eleições (M08)](13.md) | ✅ | 7 | 5 |
| 14 | [Chat com os Briefings (M09)](14.md) | ⏳ | 7, 11, 12, 4 | 5 |
| 15 | [Licenciamento B2B (M11)](15.md) | ⏳ | 1–14 | 6 |

## Ordem de execução recomendada

```
1 → 2 → 3 (paralelo com 4)
         → 4 → 5 (paralelo com 6, 7)
                → 6 → 11 (parcial)
                → 7 → 8 (paralelo com 12, 13)
                     → 12
                     → 13
              → 9 (após 5)
         → 4 + 7 + 9 → 10
         → 4 + 6 + 7 + 9 → 11
         → 7 + 11 + 12 + 4 → 14
→ 15 (último)
```

### Sequência linear recomendada para time solo
`1 → 2 → 4 → 5 → 7 → 9 → 6 → 8 → 3 → 12 → 13 → 10 → 11 → 14 → 15`

### Paralelizável para dois desenvolvedores
- **Dev A:** `1 → 2 → 4 → 5 → 9 → 10`
- **Dev B:** `1 → 2 → 7 → 8 → 12 → 13`
- Sincronização nos planos 11, 14, 15

## Módulos do PRD cobertos

| Módulo PRD | Planos | Status |
|-----------|--------|--------|
| M00 – Autenticação | Plano 2 | ✅ |
| M01 – Feed de Tensões | Planos 4, 5 | ✅ |
| M02 – Mapa de Calor | Plano 6 | ✅ |
| M03 – Biblioteca de Conteúdo | Planos 7, 8 | ✅ |
| M04 – Indicadores de Risco | Plano 9 | ✅ |
| M05 – Alerta Preditivo | Plano 10 | ⏳ |
| M06 – Perfil de País | Plano 11 | ⏳ |
| M07 – Linha do Tempo | Plano 12 | ✅ |
| M08 – Radar de Eleições | Plano 13 | ✅ |
| M09 – Chat com Briefings | Plano 14 | ⏳ |
| M10 – Hotmart/Pagamentos | Plano 3 | ✅ |
| M11 – Licenciamento B2B | Plano 15 | ⏳ |
| Infra Base | Plano 1 | ✅ |
