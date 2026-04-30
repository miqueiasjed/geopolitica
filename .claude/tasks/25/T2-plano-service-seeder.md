# T2 – PlanoService com cache + PlanoSeeder

## Objetivo
Criar o serviço central `PlanoService` que lê os recursos dos planos do banco de dados com cache Redis (TTL 10 min) e o `PlanoSeeder` que popula os dados iniciais.

## Dependência
T1 deve estar concluída (Models Plano e PlanoRecurso já existem).

## Arquivos a criar/modificar

### Service: `backend/app/Services/PlanoService.php`

Responsabilidades:
- Ler recursos do banco de dados para um dado slug de plano
- Cachear os resultados no Redis com TTL de 600 segundos (10 min)
- Prover métodos de consulta tipados para uso nos outros services/controllers
- Invalidar o cache quando um recurso é atualizado (via tag ou chave específica)

Métodos obrigatórios:
```php
// Retorna o valor bruto (string|null) de um recurso
public function valorRecurso(string $slugPlano, string $chave): ?string

// Retorna o limite inteiro (null = ilimitado)
public function limiteInteiro(string $slugPlano, string $chave): ?int

// Retorna boolean de um recurso
public function recursoBoolean(string $slugPlano, string $chave): bool

// Retorna todos os recursos de um plano (array associativo chave => valor)
public function recursosDoPlano(string $slugPlano): array

// Invalida o cache de um plano específico
public function invalidarCache(string $slugPlano): void

// Invalida cache de todos os planos
public function invalidarTodoCache(): void
```

Cache key pattern: `plano_recursos_{slugPlano}`

O service recebe o slug diretamente (ex: 'essencial', 'pro', 'reservado') — não recebe User.
Os callers (ChatService, etc.) são responsáveis por extrair o slug do plano do usuário e chamar este service.

### Seeder: `backend/database/seeders/PlanoSeeder.php`

Popula os dados iniciais com `updateOrCreate` (idempotente):

**Planos:**
1. slug='essencial', nome='Essencial', preco=0, ordem=1
2. slug='pro', nome='Pro', preco=97.00, ordem=2
3. slug='reservado', nome='Reservado', preco=197.00, ordem=3

**Recursos por plano (chave => valor):**

| Chave | Essencial | Pro | Reservado |
|-------|-----------|-----|-----------|
| chat_diario_limite | '5' | '20' | null |
| relatorio_mensal_limite | '2' | '10' | null |
| feed_historico_dias | '2' | '2' | null |
| conteudo_historico_dias | '90' | '90' | null |
| biblioteca_acesso | 'false' | 'true' | 'true' |
| monitor_eleitoral | 'false' | 'true' | 'true' |
| monitor_guerra | 'false' | 'false' | 'true' |
| risk_score | 'false' | 'true' | 'true' |
| alertas_nivel | 'medium' | 'medium,high' | 'all' |

### Registrar seeder em `DatabaseSeeder.php`
Adicionar `$this->call(PlanoSeeder::class);` no método run().

## Regras
- Seguir padrões da skill laravel-arquitetura
- O PlanoService NÃO faz Auth::user() — recebe o slug como parâmetro
- Cache com Redis (usar `Cache::remember()` ou `Redis::get/set` — preferir `Cache::remember()`)
- Código em português conforme o projeto
