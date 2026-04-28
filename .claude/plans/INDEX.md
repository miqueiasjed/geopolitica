# INDEX – Planos do Projeto Geopolítica para Investidores

> Última atualização: 2026-04-28 (Plano 23 concluído — M15 Relatório Personalizado por IA)

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
| 10 | [Alerta Preditivo (M05)](10.md) | ✅ | 4, 7, 9 | 7 |
| 11 | [Perfil de País (M06)](11.md) | ✅ | 4, 6, 7, 9 | 7 |
| 12 | [Linha do Tempo de Crises (M07)](12.md) | ✅ | 4, 7 | 5 |
| 13 | [Radar de Eleições (M08)](13.md) | ✅ | 7 | 5 |
| 14 | [Chat com os Briefings (M09)](14.md) | ✅ | 7, 11, 12, 4 | 5 |
| 15 | [Licenciamento B2B (M11)](15.md) | ✅ | 1–14 | 6 |
| 16 | [Admin IA v2: Descrições Enriquecidas e Restaurar Padrão (F1+F2)](16.md) | ✅ | 15 | 4 |
| 17 | [Admin IA v2: Modo de Teste de Prompt (F4)](17.md) | ✅ | 16 | 5 |
| 18 | [Admin IA v2: Painel de Uso da IA (F3)](18.md) | ✅ | 15, 17 | 7 |
| 19 | [Add-ons: Banco de Dados e Serviço Central](19.md) | ✅ | 3, 7 | 5 |
| 20 | [Webhook Lastlink e E-mail de Boas-vindas do Add-on](20.md) | ✅ | 19 | 4 |
| 21 | [Monitor Eleitoral e Monitor de Guerra (Frontend + Backend)](21.md) | ✅ | 19, 20, 13, 4, 5, 7, 8 | 6 |
| 22 | [Exportação para PDF (M14)](22.md) | ✅ | 7, 10, 11, 14, 15 | 7 |
| 23 | [Relatório Personalizado por IA (M15)](23.md) | ✅ | 7, 11, 12, 4, 14, 22 | 7 |
| 24 | [Risk Score de Portfólio (M16)](24.md) | ⏳ | 4, 10, 22, 19, 21 | 9 |

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

## Admin IA v2 — ordem de execução
`16 → 17 → 18`

## Módulo 13 — Verticais e Add-ons — ordem de execução
`19 → 20 → 21`

## Módulos do PRD cobertos

| Módulo PRD | Planos | Status |
|-----------|--------|--------|
| M00 – Autenticação | Plano 2 | ✅ |
| M01 – Feed de Tensões | Planos 4, 5 | ✅ |
| M02 – Mapa de Calor | Plano 6 | ✅ |
| M03 – Biblioteca de Conteúdo | Planos 7, 8 | ✅ |
| M04 – Indicadores de Risco | Plano 9 | ✅ |
| M05 – Alerta Preditivo | Plano 10 | ✅ |
| M06 – Perfil de País | Plano 11 | ✅ |
| M07 – Linha do Tempo | Plano 12 | ✅ |
| M08 – Radar de Eleições | Plano 13 | ✅ |
| M09 – Chat com Briefings | Plano 14 | ✅ |
| M10 – Hotmart/Pagamentos | Plano 3 | ✅ |
| M11 – Licenciamento B2B | Plano 15 | ✅ |
| Infra Base | Plano 1 | ✅ |
| Admin IA v2 – F1+F2 | Plano 16 | ✅ |
| Admin IA v2 – F4 | Plano 17 | ✅ |
| Admin IA v2 – F3 | Plano 18 | ✅ |
| M13 – Add-ons (banco + serviço) | Plano 19 | ✅ |
| M13 – Webhook Lastlink | Plano 20 | ✅ |
| M13 – Monitor Eleitoral + Guerra | Plano 21 | ✅ |
| M14 – Exportação para PDF | Plano 22 | ✅ |
| M15 – Relatório Personalizado por IA | Plano 23 | ✅ |
| M16 – Risk Score de Portfólio | Plano 24 | ⏳ |
