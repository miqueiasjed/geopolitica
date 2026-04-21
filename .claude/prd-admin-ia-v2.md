# PRD — Admin IA v2: Gestão Avançada de Prompts e Monitoramento de Uso

**Projeto:** Geopolítica para Investidores  
**Data:** 2026-04-21  
**Status:** Aprovado para planejamento  
**Autor:** Miqueias Mesquita

---

## 1. Contexto

O sistema já possui um painel de configurações admin com suporte a múltiplos provedores de IA (Claude e OpenAI) e edição de prompts via banco de dados. A próxima iteração foca em três eixos: **melhorar a experiência de edição de prompts**, **oferecer observabilidade do uso da IA** e **permitir teste de prompts antes de aplicar em produção**.

---

## 2. Objetivos

| # | Objetivo | Métrica de sucesso |
|---|----------|--------------------|
| 1 | Admin entende sem documentação externa o que cada prompt faz | Todas as 6 descrições indicam tela de origem e formato de saída esperado |
| 2 | Admin pode reverter um prompt ao texto padrão sem precisar lembrar o texto original | Botão "Restaurar padrão" visível por prompt, funcional sem reload |
| 3 | Equipe consegue monitorar consumo e custo estimado da IA sem acessar dashboards externos | Painel com totais diários/mensais por provider e estimativa de custo |
| 4 | Admin pode validar um prompt editado antes de salvar em produção | Campo de input + execução real da IA com retorno visível na tela |

---

## 3. Escopo — Funcionalidades

### F1 · Descrições Enriquecidas dos Prompts

**Problema:** As descrições atuais são genéricas (ex: *"Analisa notícias e classifica impacto"*) e não indicam qual tela é afetada nem o contrato de saída esperado.

**Solução:**  
Atualizar as `descricao` de cada prompt no `ConfiguracaoService` com informações estruturadas:
- **Tela afetada** (onde o resultado aparece para o usuário final)
- **Trigger** (quando o prompt é chamado — cron, ação do usuário, etc.)
- **Formato de saída obrigatório** (JSON array, JSON objeto, texto livre)
- **Variáveis disponíveis** (ex: `{{pais}}`)

**Mapeamento dos 6 prompts:**

| Chave | Tela afetada | Trigger | Saída |
|-------|-------------|---------|-------|
| `prompt_analise_sistema` | Timeline / Feed de Tensões | Cron de ingestão de feed | JSON array |
| `prompt_chat_sistema` | Chat com os Briefings | Ação do usuário (pergunta) | Texto livre (streaming) |
| `prompt_detector_sistema` | Alertas Preditivos (background) | Cron de detecção de sinais | JSON array |
| `prompt_convergencia_sistema` | Alertas Preditivos (card de alerta) | Cron de convergência | JSON `{titulo, analise}` |
| `prompt_perfil_contexto` | Perfil de País (aba Contexto) | Ação admin (gerar perfil) | Texto livre |
| `prompt_perfil_lideranca` | Perfil de País (aba Liderança) | Ação admin (gerar perfil) | Texto livre |

**Critérios de aceite:**
- Cada prompt exibe na interface: tela afetada, trigger e formato de saída
- Prompts com variáveis exibem as variáveis disponíveis como badges (ex: `{{pais}}`)
- Nenhuma alteração no comportamento do sistema — apenas metadados visuais

---

### F2 · Botão "Restaurar Padrão" nos Prompts

**Problema:** O admin que edita um prompt não tem como voltar ao texto original sem lembrar ou procurar no código-fonte.

**Solução:**  
Cada campo `textarea` de prompt ganha um botão "Restaurar padrão" que:
1. Carrega o texto padrão do backend via endpoint dedicado
2. Preenche o textarea localmente (sem salvar automaticamente)
3. O admin confirma clicando em "Salvar" normalmente

**Backend:**
- Novo endpoint `GET /api/admin/configuracoes/defaults` que retorna os textos padrão de todos os prompts (lendo de `config/ai.php` — nunca do banco)
- Nenhum dado sensível é exposto (apenas prompts, que não são sensíveis)

**Frontend:**
- Botão "↺ Restaurar padrão" no canto superior direito de cada campo textarea
- Estado de confirmação: ao clicar, exibe tooltip "Clique em Salvar para confirmar"
- O textarea fica com borda destacada em âmbar indicando que foi restaurado mas não salvo

**Critérios de aceite:**
- Botão visível apenas quando o prompt tiver sido personalizado (valor no banco ≠ null)
- Ao restaurar, o textarea recebe o texto padrão mas não é salvo automaticamente
- Ao salvar depois de restaurar, o valor é limpo no banco (null) e o padrão do `config/ai.php` volta a valer

---

### F3 · Painel de Uso da IA

**Problema:** Não há visibilidade de quantas chamadas são feitas à IA, por qual provider, com que volume de tokens, ou qual o custo estimado.

**Solução:**  
Sistema de logging de chamadas à IA com painel de visualização no admin.

**Backend:**

Nova tabela `ai_logs`:
```
id, provider (claude|openai), modelo, servico (chat|analise|detector|convergencia|perfil_contexto|perfil_lideranca),
tokens_entrada (int), tokens_saida (int), custo_estimado_usd (decimal 10,6),
duracao_ms (int), sucesso (boolean), erro (text nullable), created_at
```

Tabela de preços de referência embutida no código (atualizável via config):
- Claude Sonnet 4.6: $3/M tokens entrada, $15/M tokens saída
- GPT-4o: $2.50/M tokens entrada, $10/M tokens saída
- GPT-4o-mini: $0.15/M tokens entrada, $0.60/M tokens saída

O `AiProviderInterface` ganha um método auxiliar ou os providers registram automaticamente no log após cada chamada.

Endpoint `GET /api/admin/ai/uso` retorna:
```json
{
  "hoje": { "chamadas": 42, "tokens_total": 85000, "custo_usd": 1.24, "por_provider": {...} },
  "mes_atual": { "chamadas": 980, "tokens_total": 2100000, "custo_usd": 31.50 },
  "por_servico": [ { "servico": "chat", "chamadas": 312, ... }, ... ],
  "historico_7d": [ { "data": "2026-04-15", "chamadas": 120, "custo_usd": 4.20 }, ... ]
}
```

**Frontend:**

Nova rota `/admin/ia/uso` com:
- Cards de resumo: Chamadas hoje / Tokens hoje / Custo estimado hoje / Custo estimado mês
- Gráfico de barras simples (últimos 7 dias) — implementado com CSS puro, sem biblioteca
- Tabela com breakdown por serviço (qual feature gera mais chamadas)
- Badge do provider ativo com comparativo de custo Claude vs OpenAI
- Aviso visual quando custo mensal estimado ultrapassa threshold configurável

**Critérios de aceite:**
- Log registra toda chamada com sucesso ou erro
- Falhas de log não devem bloquear a chamada à IA (log em fire-and-forget)
- Custo estimado é claramente rotulado como "estimado" (não real)
- Dados históricos mantidos por 90 dias (TTL por migration ou job de limpeza)

---

### F4 · Modo de Teste de Prompt

**Problema:** Editar um prompt e só descobrir o resultado em produção é arriscado — um prompt mal formulado pode quebrar o parsing de JSON ou degradar a qualidade das análises.

**Solução:**  
Cada campo textarea de prompt ganha uma área de teste colapsável que permite executar o prompt com uma entrada de amostra antes de salvar.

**Interface:**
- Abaixo de cada textarea, link "▶ Testar este prompt" que expande um painel
- Campo de texto para a **entrada de teste** (o que seria enviado como mensagem do usuário)
- Botão "Executar" que chama a IA com o prompt atual do textarea (não o salvo no banco)
- Área de resultado com resposta da IA e tempo de execução em ms
- Para prompts que exigem JSON, validação automática do JSON retornado com indicador verde/vermelho

**Backend:**

Novo endpoint `POST /api/admin/ai/testar-prompt`:
```json
{
  "prompt_sistema": "...",
  "mensagem_usuario": "...",
  "max_tokens": 512
}
```
Retorna:
```json
{
  "resposta": "...",
  "provider": "claude",
  "modelo": "claude-sonnet-4-6",
  "tokens_entrada": 210,
  "tokens_saida": 95,
  "duracao_ms": 1340,
  "json_valido": true
}
```

**Segurança:**
- Endpoint restrito a admins (mesmo middleware dos demais endpoints admin)
- `max_tokens` limitado a 1024 no backend (proteção contra abuso)
- Rate limit: máximo 20 testes por minuto por admin

**Critérios de aceite:**
- O teste usa o texto do textarea atual, não o valor salvo no banco
- O resultado não afeta nenhum dado de produção
- Prompts que retornam JSON têm validação visual do formato
- A IA usada no teste é o provider ativo nas configurações

---

## 4. Fora de Escopo

- Versionamento/histórico de prompts (pode ser PRD futuro)
- A/B testing de prompts
- Exportação de logs de uso em CSV
- Alertas automáticos por e-mail ao atingir threshold de custo
- Suporte a outros providers além de Claude e OpenAI

---

## 5. Dependências Técnicas

| Dependência | Status | Obs |
|-------------|--------|-----|
| Multi-provider IA (Claude/OpenAI) | ✅ Concluído | Base para F3 e F4 |
| Tela Admin Configurações | ✅ Concluído | Base para F1, F2 e F4 |
| Tabela `configuracoes` | ✅ Concluído | Base para F2 |
| Tabela `ai_logs` (nova) | ⏳ Pendente | Necessária para F3 |

---

## 6. Ordem de Implementação Recomendada

```
F1 (descrições) → imediato, zero risco, puro metadado
F2 (restaurar padrão) → baixo risco, apenas novo endpoint + UI
F4 (teste de prompt) → médio esforço, novo endpoint + painel colapsável
F3 (painel de uso) → maior esforço, nova tabela + logging + dashboard
```

F1 e F2 podem ser feitos em paralelo. F4 antes de F3 pois é mais visível para o admin no dia a dia.

---

## 7. Estimativa de Esforço

| Feature | Backend | Frontend | Total |
|---------|---------|----------|-------|
| F1 · Descrições enriquecidas | 1h | 1h | ~2h |
| F2 · Restaurar padrão | 1h | 2h | ~3h |
| F4 · Teste de prompt | 2h | 3h | ~5h |
| F3 · Painel de uso | 4h | 4h | ~8h |
| **Total** | **8h** | **10h** | **~18h** |
