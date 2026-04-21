# Manual de Utilização — Geopolítica para Investidores

> Plataforma de inteligência geopolítica com IA para investidores.  
> Stack: Laravel 13 + React 19 + MySQL + Redis + Claude API

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Módulos e Funcionalidades](#2-módulos-e-funcionalidades)
3. [Planos de Assinatura](#3-planos-de-assinatura)
4. [Acesso e Autenticação](#4-acesso-e-autenticação)
5. [Feed de Tensões (M01)](#5-feed-de-tensões-m01)
6. [Mapa de Calor Geopolítico (M02)](#6-mapa-de-calor-geopolítico-m02)
7. [Biblioteca de Conteúdo (M03)](#7-biblioteca-de-conteúdo-m03)
8. [Indicadores de Risco (M04)](#8-indicadores-de-risco-m04)
9. [Alerta Preditivo (M05)](#9-alerta-preditivo-m05)
10. [Perfil de País (M06)](#10-perfil-de-país-m06)
11. [Linha do Tempo de Crises (M07)](#11-linha-do-tempo-de-crises-m07)
12. [Radar de Eleições (M08)](#12-radar-de-eleições-m08)
13. [Chat com os Briefings (M09)](#13-chat-com-os-briefings-m09)
14. [Integração Hotmart (M10)](#14-integração-hotmart-m10)
15. [Licenciamento B2B (M11)](#15-licenciamento-b2b-m11)
16. [Painel Administrativo](#16-painel-administrativo)
17. [Arquitetura Técnica](#17-arquitetura-técnica)
18. [Configuração do Ambiente](#18-configuração-do-ambiente)
19. [Comandos Úteis](#19-comandos-úteis)

---

## 1. Visão Geral do Sistema

A plataforma **Geopolítica para Investidores** entrega inteligência geopolítica em tempo real, analisada com IA, para investidores tomarem decisões com mais contexto. O sistema combina:

- **Coleta automática** de eventos geopolíticos via RSS (GDELT, Reuters, Bloomberg, AFP)
- **Análise com IA** (Claude API) para cada evento captado
- **Módulos temáticos** cobrindo tensões, crises, eleições, indicadores e riscos por país
- **Chat em linguagem natural** para consultar todo o acervo do canal
- **Multi-tenant B2B** para gestoras, family offices e consultorias

### Personas

| Persona | Uso principal |
|---|---|
| **Assinante Essencial** | Leitura do feed e biblioteca básica |
| **Assinante Pro** | Feed, biblioteca, mapa, indicadores e alertas |
| **Assinante Reservado** | Acesso completo a todos os módulos + chat ilimitado |
| **Admin** | Gestão da plataforma, assinantes e conteúdo |
| **Company Admin (B2B)** | Gestão da equipe dentro da licença da empresa |

---

## 2. Módulos e Funcionalidades

| Módulo | Nome | Status |
|---|---|---|
| M00 | Autenticação e Onboarding | Produção |
| M01 | Feed de Tensões | Produção |
| M02 | Mapa de Calor Geopolítico | Produção |
| M03 | Biblioteca de Conteúdo | Produção |
| M04 | Indicadores de Risco | Produção |
| M05 | Alerta Preditivo | Produção |
| M06 | Perfil de País | Produção |
| M07 | Linha do Tempo de Crises | Produção |
| M08 | Radar de Eleições | Produção |
| M09 | Chat com os Briefings | Produção |
| M10 | Integração Hotmart | Produção |
| M11 | Licenciamento B2B | Produção |

---

## 3. Planos de Assinatura

| Recurso | Essencial | Pro | Reservado |
|---|:---:|:---:|:---:|
| Feed de Tensões (básico) | ✅ | ✅ | ✅ |
| Biblioteca de Conteúdo | Parcial | ✅ | ✅ |
| Mapa de Calor | — | ✅ | ✅ |
| Indicadores de Risco | — | ✅ | ✅ |
| Alerta Preditivo | — | ✅ | ✅ |
| Perfil de País | — | ✅ | ✅ |
| Linha do Tempo de Crises | — | Parcial | ✅ |
| Radar de Eleições | — | ✅ | ✅ |
| Chat com Briefings | 5/dia | 20/dia | Ilimitado |

---

## 4. Acesso e Autenticação

### Como a conta é criada

**Não existe cadastro público.** Toda conta é criada automaticamente quando o Hotmart confirma uma compra. O fluxo é:

1. Compra aprovada no Hotmart
2. Webhook Hotmart → `POST /api/webhooks/hotmart` → cria usuário + role
3. E-mail automático com link para **definir a senha** é enviado ao assinante
4. Assinante clica no link, define sua senha e acessa o dashboard

### Login

- **URL:** `https://app.geopoliticainvestidores.com.br/login`
- **Método:** E-mail + senha
- **Token:** Bearer token Sanctum armazenado em `localStorage`
- **Sessão:** Permanente até logout explícito

### Redefinição de senha

1. Acessar `/esqueci-senha`
2. Informar e-mail cadastrado
3. Clicar no link recebido por e-mail (`/redefinir-senha?token=...`)
4. Definir nova senha

### Roles disponíveis

| Role | Descrição |
|---|---|
| `assinante_essencial` | Plano básico |
| `assinante_pro` | Plano intermediário |
| `assinante_reservado` | Plano completo |
| `admin` | Acesso total à plataforma |
| `company_admin` | Admin da licença B2B |
| `reader` | Membro leitura de licença B2B |

---

## 5. Feed de Tensões (M01)

O Feed exibe eventos geopolíticos coletados automaticamente, analisados por IA.

### Como funciona

- **Coleta:** Job Laravel roda a cada hora buscando RSS de fontes configuradas (GDELT, Reuters, AFP, Bloomberg)
- **Análise:** Cada evento novo é enviado para a Claude API, que gera `analise_ia` (resumo + impacto para investidores)
- **Exibição:** Eventos ordenados por data, com filtros por região e tag

### Interface

- **Página:** `/feed`
- **Filtros:** Região geográfica, tags, período
- **Cards:** Título, fonte, data, resumo IA, link original
- **Badge de intensidade:** Escala 1–10 calculada pela IA

### Configuração de fontes (admin)

Fontes RSS são configuradas em `config/feed.php`:

```php
'sources' => [
    ['name' => 'GDELT', 'url' => 'https://...', 'region' => 'global'],
    // ...
]
```

---

## 6. Mapa de Calor Geopolítico (M02)

Visualização interativa do nível de tensão geopolítica por país no mundo.

### Como funciona

- **Dados:** Intensidade calculada a partir dos eventos do Feed (M01) por país/região
- **Atualização:** Recalculada via job agendado (diário)
- **Visualização:** Mapa mundial com escala de cor por intensidade (verde → vermelho)

### Interface

- **Página:** `/mapa`
- **Interação:** Clicar num país abre painel lateral com eventos recentes daquele país
- **Legenda:** Escala de intensidade 0–10
- **Filtro de período:** Últimos 7, 30 ou 90 dias

---

## 7. Biblioteca de Conteúdo (M03)

Acervo de conteúdo publicado pelo canal: briefings, mapas analíticos e edições de "A Tese".

### Tipos de conteúdo

| Tipo | Descrição |
|---|---|
| `briefing` | Análise textual de evento ou tema geopolítico |
| `mapa` | Mapa analítico com contexto geográfico |
| `a_tese` | Edição da newsletter A Tese |

### Interface

- **Página:** `/biblioteca`
- **Filtros:** Tipo, data, tag, país
- **Busca full-text:** Por título e corpo do conteúdo
- **Acesso por plano:** Conteúdos podem ser marcados como exclusivos por plano

### Publicação (admin)

1. Acessar `/admin/conteudos`
2. Clicar em "Novo Conteúdo"
3. Preencher título, tipo, corpo (Markdown), tags e plano mínimo
4. Publicar

---

## 8. Indicadores de Risco (M04)

Painel com indicadores quantitativos de risco geopolítico por país e região.

### Indicadores disponíveis

- Índice de instabilidade política
- Risco cambial geopolítico
- Tensão em rotas comerciais estratégicas
- Exposição a sanções internacionais

### Interface

- **Página:** `/indicadores`
- **Visualização:** Cards com valor atual, variação e gráfico histórico (sparkline)
- **Filtro:** Por país, região ou categoria de risco
- **Histórico:** Gráfico de série temporal com últimos 12 meses

---

## 9. Alerta Preditivo (M05)

Sistema de alertas gerados por IA baseados em padrões históricos e eventos recentes.

### Como funciona

1. Job diário analisa eventos recentes (M01) + crises históricas (M07) + indicadores (M04)
2. Claude API identifica padrões de escalada e gera alertas com probabilidade e prazo estimado
3. Alertas são enviados por e-mail e exibidos no painel

### Interface

- **Página:** `/alertas` (acesso a partir do dashboard)
- **Card de alerta:** Título, descrição, probabilidade (%), prazo estimado, países envolvidos
- **Status:** Ativo / Resolvido / Falso positivo (admin pode marcar)
- **Leitura:** Clicar no alerta marca como lido; badge de não lidos no header

### Configuração de threshold (admin)

Em `config/claude.php`:

```php
'alerta_probabilidade_minima' => 60, // apenas alertas com ≥60% são enviados
```

---

## 10. Perfil de País (M06)

Página dedicada a cada país com contexto geopolítico, liderança atual, eventos recentes e indicadores.

### Interface

- **URL:** `/pais/{iso}` (ex.: `/pais/BR`, `/pais/CN`)
- **Seções:**
  - Contexto geopolítico (texto curado + IA)
  - Liderança atual (nome, cargo, partido, desde quando)
  - Eventos recentes do Feed filtrados por país
  - Indicadores de risco do país
  - Crises históricas relacionadas

### Meus Países

- **Página:** `/meus-paises`
- Assinante pode favoritar países para receber alertas prioritários deles

---

## 11. Linha do Tempo de Crises (M07)

Acervo histórico de crises geopolíticas com padrões, causas e impactos documentados.

### Interface

- **Página:** `/timeline`
- **Visualização:** Linha do tempo vertical com crises ordenadas por data
- **Filtros:** Por região, tipo de crise (guerra, sanção, revolução, etc.), período
- **Detalhe de crise:** Contexto geopolítico, causas, impactos econômicos, desfecho, paralelos atuais

### Uso no Chat

As crises históricas são fontes de contexto para o Chat (M09). O assinante pode perguntar: *"que crises têm padrão similar ao que está acontecendo no Oriente Médio?"*

---

## 12. Radar de Eleições (M08)

Calendário e análise de eleições globais relevantes para investidores.

### Interface

- **Página:** `/eleicoes`
- **Visualização:** Cards com próximas eleições e eleições recentes
- **Dados por eleição:** País, data, candidatos favoritos, impacto esperado para mercados, análise IA
- **Filtros:** Por região, período, relevância para mercados

---

## 13. Chat com os Briefings (M09)

Interface de conversa em linguagem natural para consultar todo o acervo do canal.

### Fontes consultadas pela IA

1. **Biblioteca de Conteúdo (M03)** — briefings, mapas, A Tese
2. **Feed de Eventos (M01)** — eventos geopolíticos recentes
3. **Perfis de Países (M06)** — contexto e liderança
4. **Crises Históricas (M07)** — padrões e impactos

### Limites por plano

| Plano | Perguntas/dia |
|---|---|
| Essencial | 5 |
| Pro | 20 |
| Reservado | Ilimitado |
| B2B (por usuário) | 50 |

O contador reinicia à meia-noite (horário de Brasília). Ao atingir o limite, o assinante vê mensagem de upgrade.

### Exemplos de perguntas

- *"O que o canal publicou sobre a guerra do Irã?"*
- *"Quais crises históricas têm padrão similar ao Oriente Médio hoje?"*
- *"Como a eleição alemã pode afetar o agro brasileiro?"*
- *"Qual o histórico de tensões entre China e Taiwan nos últimos 5 anos?"*

### Interface

- **Página:** `/chat`
- **Histórico:** Persistido por sessão diária (novo dia = nova sessão)
- **Referências:** Cada resposta cita as fontes consultadas com links

---

## 14. Integração Hotmart (M10)

Toda a aquisição de assinantes passa pelo Hotmart. O sistema não processa pagamentos diretamente.

### Fluxo de compra aprovada

```
Hotmart → POST /api/webhooks/hotmart
        → Verifica assinatura HMAC (HOTMART_SECRET)
        → Cria User + Assinante + assignRole(plano)
        → Dispara e-mail de boas-vindas com link de definição de senha
```

### Fluxo de cancelamento/chargeback

```
Hotmart → POST /api/webhooks/hotmart (evento: CANCELLATION / CHARGEBACK)
        → Atualiza assinante: ativo = false
        → Acesso bloqueado imediatamente (middleware EnsureAssinanteAtivo)
```

### Configuração

Em `.env`:

```
HOTMART_SECRET=sua_chave_hmac_aqui
HOTMART_BASE_URL=https://developers.hotmart.com/payments/api/v1
```

### Eventos suportados

| Evento Hotmart | Ação |
|---|---|
| `PURCHASE_APPROVED` | Cria conta + envia e-mail |
| `PURCHASE_CANCELED` | Desativa assinante |
| `PURCHASE_CHARGEBACK` | Desativa assinante |
| `PURCHASE_REFUNDED` | Desativa assinante |
| `SUBSCRIPTION_REACTIVATED` | Reativa assinante |

---

## 15. Licenciamento B2B (M11)

Permite que empresas (gestoras, family offices, consultorias) acessem a plataforma com subdomínio próprio.

### Como funciona

- Cada empresa recebe um **subdomínio único**: `empresa.geopoliticainvestidores.com.br`
- O subdomínio identifica o tenant automaticamente (middleware `IdentificarTenantMiddleware`)
- Logo e nome da empresa aparecem na navegação
- O `company_admin` gerencia a equipe pelo painel

### Criação de licença B2B (admin)

1. Acessar `/admin/b2b`
2. Clicar em "Nova Licença"
3. Preencher: nome da empresa, subdomínio, limite de usuários, data de expiração
4. Salvar — o subdomínio entra em produção imediatamente

### Convite de membros (company_admin)

1. Acessar o painel da empresa em `empresa.geopoliticainvestidores.com.br`
2. Ir em "Equipe" → "Convidar Membro"
3. Informar e-mail do convidado
4. O sistema envia e-mail com link de aceite
5. Ao aceitar, conta é criada com role `reader` (ou `company_admin` se configurado)

### Limites

| Item | Configurável |
|---|---|
| Usuários por licença | Sim (padrão: 5–20) |
| Perguntas no Chat | 50/usuário/dia |
| Acesso aos módulos | Equivalente ao plano Reservado |
| Validade da licença | Data de expiração configurável |

### Expiração

Scheduler verifica diariamente as licenças. Licenças vencidas são desativadas automaticamente e todos os membros perdem acesso.

---

## 16. Painel Administrativo

Acessível somente para usuários com role `admin`.

### URLs do painel

| Área | URL |
|---|---|
| Dashboard admin | `/admin` |
| Assinantes | `/admin/assinantes` |
| Conteúdos | `/admin/conteudos` |
| Webhooks | `/admin/webhooks` |
| Licenças B2B | `/admin/b2b` |

### Gestão de assinantes

- Listar, buscar e filtrar assinantes
- Ativar/desativar manualmente
- Trocar plano (role)
- Ver histórico de acessos

### Gestão de conteúdo

- Criar, editar e publicar briefings, mapas e edições
- Definir plano mínimo de acesso por conteúdo
- Gerenciar tags e categorias

### Webhooks

- Visualizar histórico de webhooks recebidos do Hotmart
- Reprocessar webhooks com falha

---

## 17. Arquitetura Técnica

### Stack

| Camada | Tecnologia |
|---|---|
| Backend | Laravel 13 (PHP 8.3) |
| Frontend | React 19 + Vite + TypeScript |
| Estilo | TailwindCSS 4 + Radix UI |
| Estado servidor | TanStack Query v5 |
| Roteamento | React Router v7 |
| Banco de dados | MySQL 8.0 |
| Cache / Filas / Sessões | Redis |
| Autenticação | Laravel Sanctum (Bearer token) |
| Autorização | Spatie Laravel Permission |
| IA | Claude API (Anthropic) |
| E-mail | SMTP via Resend / SES / Mailgun |
| Filas | Laravel Queues (Redis driver) |
| Agendamento | Laravel Scheduler |

### Estrutura de diretórios

```
geopolitica/
├── backend/                    # API Laravel 13
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # Controllers por módulo
│   │   │   ├── Middleware/     # EnsureAssinanteAtivo, IdentificarTenant
│   │   │   └── Requests/       # FormRequests de validação
│   │   ├── Models/             # Eloquent Models
│   │   ├── Services/           # Lógica de negócio
│   │   └── Jobs/               # Jobs de coleta e análise IA
│   ├── config/
│   │   ├── claude.php          # Configurações da Claude API
│   │   └── feed.php            # Fontes RSS e coleta
│   └── routes/api.php          # Todas as rotas da API
│
└── frontend/                   # SPA React 19
    └── src/
        ├── pages/              # Páginas (Feed, Mapa, Biblioteca, etc.)
        ├── components/         # Componentes reutilizáveis
        ├── contexts/           # AuthContext, TenantContext
        ├── hooks/              # Hooks TanStack Query por módulo
        ├── services/           # Chamadas à API
        └── router/             # Configuração React Router v7
```

### Principais Models

| Model | Tabela | Descrição |
|---|---|---|
| `User` | `users` | Usuário da plataforma |
| `Assinante` | `assinantes` | Dados do assinante (ativo, plano) |
| `Event` | `eventos` | Eventos geopolíticos do feed |
| `Conteudo` | `conteudos` | Biblioteca de conteúdo |
| `PerfilPais` | `perfis_paises` | Perfis geopolíticos de países |
| `CriseHistorica` | `crises_historicas` | Acervo histórico de crises |
| `Eleicao` | `eleicoes` | Radar de eleições |
| `Indicador` | `indicadores` | Indicadores de risco |
| `AlertaPreditivo` | `alertas_preditivos` | Alertas gerados por IA |
| `ChatSessao` | `chat_sessoes` | Sessões do chat por dia |
| `ChatMensagem` | `chat_mensagens` | Histórico do chat |
| `Empresa` | `empresas` | Licenças B2B |
| `LicencaB2B` | `licencas_b2b` | Dados da licença |
| `MembroB2B` | `membros_b2b` | Membros da licença |

---

## 18. Configuração do Ambiente

### Variáveis de ambiente obrigatórias (`.env`)

```env
# App
APP_NAME="Geopolítica para Investidores"
APP_URL=https://api.geopoliticainvestidores.com.br
FRONTEND_URL=https://app.geopoliticainvestidores.com.br

# Banco de dados
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=geopolitica
DB_USERNAME=
DB_PASSWORD=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Claude API (Anthropic)
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6

# Hotmart
HOTMART_SECRET=
HOTMART_BASE_URL=https://developers.hotmart.com/payments/api/v1

# E-mail
MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@geopoliticainvestidores.com.br
MAIL_FROM_NAME="Geopolítica para Investidores"

# Sanctum
SANCTUM_STATEFUL_DOMAINS=app.geopoliticainvestidores.com.br
```

### Configurações de IA (`config/claude.php`)

```php
return [
    'model'                       => env('CLAUDE_MODEL', 'claude-sonnet-4-6'),
    'max_tokens'                  => 1024,
    'alerta_probabilidade_minima' => 60,   // % mínimo para disparar alerta
    'chat_contexto_max_items'     => 10,   // itens por fonte no contexto do chat
];
```

### Configurações de feed (`config/feed.php`)

```php
return [
    'sources' => [
        ['name' => 'GDELT',    'url' => 'https://...', 'region' => 'global'],
        ['name' => 'Reuters',  'url' => 'https://...', 'region' => 'global'],
        ['name' => 'AFP',      'url' => 'https://...', 'region' => 'global'],
    ],
    'coleta_intervalo_horas' => 1,
    'max_eventos_por_coleta' => 50,
];
```

---

## 19. Comandos Úteis

### Setup inicial

```bash
# Backend
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

# Frontend
cd frontend
npm install
npm run build
```

### Desenvolvimento local

```bash
# Backend — servidor de desenvolvimento
cd backend && php artisan serve

# Filas — processar jobs em background
cd backend && php artisan queue:work --queue=default,feeds,ai

# Scheduler — rodar tarefas agendadas (em produção usa cron)
cd backend && php artisan schedule:work

# Frontend — servidor Vite com hot reload
cd frontend && npm run dev
```

### Jobs e agendamento

```bash
# Coletar eventos do feed manualmente
php artisan feed:collect

# Recalcular mapa de intensidade
php artisan mapa:recalcular

# Gerar alertas preditivos
php artisan alertas:gerar

# Verificar licenças B2B expiradas
php artisan b2b:verificar-expiracoes
```

### Criar admin manualmente

```bash
php artisan tinker
>>> $user = User::create(['name' => 'Admin', 'email' => 'admin@...', 'password' => bcrypt('senha')]);
>>> $user->assignRole('admin');
```

### Cache e filas

```bash
# Limpar cache
php artisan cache:clear

# Limpar filas (cuidado em produção)
php artisan queue:flush

# Ver status das filas
php artisan queue:monitor
```

### Cron (produção)

Adicionar ao crontab do servidor:

```
* * * * * cd /caminho/para/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

*Última atualização: Abril 2026 — todos os módulos (M00–M11) em produção.*
