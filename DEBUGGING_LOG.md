# Debugging Log — Pipeline de Dados (Feed + Mapa de Calor)
Data: 2026-04-26

---

## PROBLEMA 1 — Vendor corrompido após deploy (RESOLVIDO)

**Sintoma:**
- `ProcessFeedUpdateJob` completava em ~86ms (falha silenciosa)
- Log: `PHP Fatal error: include(.../symfony/string/UnicodeString.php): Failed to open stream: No such file or directory`

**Causa:**
- Deploy zero-downtime gerou release com `vendor/` incompleto
- `composer install` não executou corretamente durante o deploy

**Resolução:**
- Redeploy pelo Forge para regerar a release com vendor correto

---

## PROBLEMA 2 — Nenhuma fonte RSS cadastrada (RESOLVIDO)

**Sintoma:**
- `ProcessFeedUpdateJob` completava em ~108ms
- Log: `[FeedUpdater] Nenhuma fonte ativa cadastrada. total_fontes: 0`
- Feed sem nenhum evento

**Causa:**
- Tabela `sources` vazia em produção — seeder não havia sido rodado

**Resolução:**
- Criado `AdminSourceController` com CRUD completo
- Atualizado `SourcesSeeder` com 15 fontes geopolíticas/econômicas (Reuters, BBC, Al Jazeera, Bloomberg, FT, etc.) todas com `ativo = true`
- Rodado `php artisan db:seed --class=SourcesSeeder` em produção
- Criada página admin `/admin/fontes` para gerenciar fontes via UI

**Arquivos alterados:**
- `backend/app/Http/Controllers/Api/Admin/AdminSourceController.php` (novo)
- `backend/database/seeders/SourcesSeeder.php`
- `backend/routes/api.php`
- `frontend/src/pages/admin/AdminFontes.tsx` (novo)
- `frontend/src/router/index.tsx`
- `frontend/src/components/AdminLayout.tsx`
- `frontend/src/services/admin.ts`
- `frontend/src/types/admin.ts`

---

## PROBLEMA 3 — Feed funcionando mas títulos em inglês (RESOLVIDO)

**Sintoma:**
- Eventos aparecendo no feed com título original em inglês
- Ex: "Alleged Trump shooter was targeting US officials, authorities say"

**Causa:**
- Prompt da IA não pedia tradução do título
- `EventResource` não expunha `fonte_url` (link da fonte não chegava ao frontend)

**Resolução:**
- Prompt `analise_sistema` atualizado para incluir `titulo` (traduzido para PT-BR) no JSON de resposta
- `AiAnalyzerService::enriquecerItem()` atualizado para sobrescrever o título com a versão traduzida pela IA
- `EventResource` atualizado para incluir `fonte_url`
- Nota: eventos já salvos no banco ficam em inglês; apenas os novos terão título em PT-BR

**Arquivos alterados:**
- `backend/config/ai.php`
- `backend/app/Services/AiAnalyzerService.php`
- `backend/app/Http/Resources/EventResource.php`

---

## PROBLEMA 4 — Redis connection error no queue worker (RESOLVIDO)

**Sintoma:**
- `Predis\Connection\ConnectionException: Stream is already at the end [tcp://127.0.0.1:6379]`

**Causa:**
- Redis foi reiniciado enquanto o queue worker estava ativo
- Conexão TCP do Predis expirou

**Resolução:**
- Reiniciar o Redis: `sudo systemctl restart redis`
- Reiniciar o daemon: `sudo supervisorctl restart daemon-781071:*`
- Prevenção: configurar `read_write_timeout: -1` no config Redis do Laravel

---

## PROBLEMA 5 — Mapa de Calor com total_paises: 0 (EM INVESTIGAÇÃO)

**Sintoma:**
- `GdeltCache::count()` = 0
- Log: `[MapaIntensidade] Dados buscados do banco. total_paises: 0`
- Mapa de calor sem dados

**Causa raiz identificada:**
- Endpoint original da GDELT (`summary/summary` com `ts=custom&sdt=&edt=`) retornava HTML vazio — parâmetros de data obrigatórios estavam ausentes

**Tentativas de correção:**

### Tentativa 1 — Trocar endpoint para DOC API (PARCIAL)
- Endpoint alterado para `api/v2/doc/doc?mode=ArtList&format=json`
- Funciona localmente via curl: retorna 130 artigos com `sourcecountry`
- **Problema:** URL com `%20` codificado no PHP estava causando double-encoding em testes via tinker (multi-linha corrompida). Job real ainda falhava.

### Tentativa 2 — Separar parâmetros da URL (PARCIAL)
- Alterado `Http::get(ENDPOINT)` para `Http::get(BASE_URL, PARAMS)`
- Laravel encoda corretamente os parâmetros
- **Problema:** SSL connection timeout persiste no servidor

### Tentativa 3 — Adicionar User-Agent (NÃO RESOLVEU)
- Adicionado `User-Agent: Mozilla/5.0 (compatible; GeopoliticaBot/1.0)`
- SSL timeout continuou

### Tentativa 4 — Forçar IPv4 (NÃO RESOLVEU)
- Adicionado `CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4`
- `curl -4 -s 'https://api.gdeltproject.org/api/v2/doc/doc?query=war&mode=ArtList&format=json&timespan=1h&maxrecords=3'` → retornou vazio (sem timeout, sem erro, mas sem dados)

### CONCLUSÃO DEFINITIVA — IP do servidor bloqueado pelo GDELT
- GDELT bloqueia IPs de data centers/VPS/cloud para o endpoint `doc/doc`
- `curl -v` com query inválida (`?mode=ArtList` sem `query=`) retorna HTTP 200 com "Your query was too short" — o erro é retornado ANTES do check de IP
- `curl` com query válida retorna body vazio — bloqueio silencioso por IP
- Da máquina local (IP residencial): funciona, retorna 130 artigos com `sourcecountry`
- **GDELT não é viável como fonte de dados em servidor cloud**

**Diagnósticos importantes:**
- `LOG_LEVEL=error` no `.env` de produção silenciava todos os `Log::warning()` e `Log::info()` — dificultou muito o debugging
- Tinker multi-linha corrompe URLs (espaços viram `%20%20...%0A`) — usar sempre `--execute` com uma única linha
- Curl do sistema com query inválida: HTTP 200 (enganoso — só responde ao erro antes do check de IP)
- PHP/Guzzle com query válida: `cURL error 28: SSL connection timeout` (bloqueio causa timeout no handshake)

**Alternativas para o Mapa de Calor (a implementar):**
1. **Derivar dos eventos RSS já coletados** — pedir à IA que retorne `pais_codigo` (ISO) durante a análise e agregar `impact_score` por país → popula `gdelt_cache` sem API externa
2. **NewsAPI** (`newsapi.org`) — API confiável, funciona de servidores, tem filtragem por país, plano gratuito disponível
3. **GNews API** (`gnews.io`) — similar ao NewsAPI, também funciona de servidores

---

## NOTAS GERAIS

- `LOG_LEVEL=error` em produção oculta warnings e infos — para debugar, trocar temporariamente para `warning`, rodar o teste e restaurar
- Logs do pipeline ficam em `storage/logs/pipeline.log` (canal separado)
- Logs gerais ficam em `storage/logs/laravel.log`
- Após zero-downtime deploy, `current/` aponta para nova release — logs antigos ficam na release anterior
- Tinker multi-linha corrompe URLs — sempre usar `--execute` com uma única linha
