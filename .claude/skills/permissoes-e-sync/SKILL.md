---
name: permissoes-e-sync
description: Diretrizes de uso do Spatie Permission, SyncPermissions, e estrutura de autorização no sistema.
---
# Skill: Permissões e SyncPermissions – Geopolitica para Investidores

Você está trabalhando em um projeto Laravel que usa **Spatie Permission** para controle de acesso.

Este projeto tem uma convenção rígida para criação e sincronização de permissões.

## 1. Uso geral de Spatie Permission

- Roles representam os planos/perfis do assinante:
  - `essencial` — acesso básico (feed, mapa, biblioteca, indicadores).
  - `pro` — acesso completo (+ alertas preditivos, chat, radar de eleições).
  - `reservado` — acesso VIP com funcionalidades exclusivas.
  - `admin` — acesso total ao painel administrativo.
- Permissions representam ações específicas:
  - Ex: `alertas-preditivos-view`, `chat-briefings-access`, `radar-eleicoes-view`, `perfil-pais-export`.

### 1.1. Middlewares

- Para proteger rotas, use SEMPRE os middlewares do Spatie:
  - `role:admin`
  - `permission:alertas-preditivos-view`
  - `role:pro|reservado|admin`
- Prefira aplicar middlewares:
  - Em grupos de rotas no `routes/*.php`.
  - Em controllers via `__construct()`.
- **Regra crítica:** assinantes com acesso revogado (cancelamento no Hotmart) devem ser bloqueados **imediatamente** via middleware — não depender de verificação no controller.

### 1.2. Controllers x Services x Policies

- Controllers:
  - Não devem conter lógica de autorização complexa.
  - Devem apenas checar se o usuário passou pelos middlewares corretos e orquestrar chamadas.

- Services:
  - Quando a autorização estiver intimamente ligada à regra de negócio, revalide permissões dentro do Service (por exemplo, checar se o usuário pode cancelar um agendamento com base em regras de plano, horário, etc.).

- Policies/Gates:
  - Usadas apenas quando for necessário controlar acesso a uma instância específica de Model (ex: se um usuário pode editar um registro específico).
  - O padrão deste projeto é priorizar **Spatie Permission**; policies são exceção, não regra.

---

## 2. Comando SyncPermissions

O projeto possui um comando dedicado para manter as permissões sincronizadas:

- Arquivo: `app/Console/Commands/SyncPermissions.php`.
- Método principal: `getAllPermissions()`.
- Este método deve conter **TODAS** as permissões existentes no sistema.

### 2.1. Regra de ouro

Sempre que você:

- Criar uma nova permissão em Seeders (ex: `RolesTableSeeder`, `CoursePermissionsSeeder`);
- Criar permissões em comandos (ex: `SetupAvaliacoesPermissions`);
- Criar permissões dinamicamente em qualquer parte do código;

Você **DEVE**:

1. Adicionar essa permissão no array retornado por `getAllPermissions()` em `SyncPermissions`.
2. Organizar essa permissão na categoria correta (gerais, avaliações, cursos, etc.).
3. Executar o comando:

```bash
php artisan permissions:sync
```
