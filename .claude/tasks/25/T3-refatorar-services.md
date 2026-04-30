# T3 – Refatorar ChatService, RelatorioIaService e CarteiraRiscoController

## Objetivo
Substituir as constantes hardcoded de limites e permissões por chamadas ao `PlanoService`, que lê os valores do banco de dados com cache Redis.

## Dependência
T2 deve estar concluída (`PlanoService` já existe em `backend/app/Services/PlanoService.php`).

## Contexto do problema atual

### ChatService (`backend/app/Services/ChatService.php`)
Atualmente tem:
```php
private const LIMITES_POR_PLANO = [
    'assinante_essencial' => 5,
    'assinante_pro'       => 20,
];
private const PLANOS_SEM_LIMITE = ['assinante_reservado', 'admin'];
```
E usa `$usuario->getRoleNames()->first()` que retorna strings com prefixo 'assinante_'.

### RelatorioIaService (`backend/app/Services/RelatorioIaService.php`)
Atualmente tem:
```php
private const LIMITES_POR_PLANO = [
    'assinante_essencial' => 2,
    'assinante_pro'       => 10,
];
private const PLANOS_SEM_LIMITE = ['assinante_reservado', 'admin'];
```

### CarteiraRiscoController (`backend/app/Http/Controllers/Api/CarteiraRiscoController.php`)
Atualmente tem:
```php
private function verificarAcessoRiskScore(): void
{
    $plano = auth()->user()->assinante?->plano;
    if (! in_array($plano, ['pro', 'reservado', 'admin'], true)) {
        abort(403, 'Risk Score disponível apenas para planos Pro e Reservado.');
    }
}
```

## Mudanças necessárias

### Helper de extração do slug do plano
Em cada lugar que precisar extrair o slug, usar este padrão:
```php
// Para usuários com assinante:
$slugPlano = $usuario->assinante?->plano ?? 'essencial';

// Para admin sem assinante → retorna null do plano, 
// null significa ilimitado (o PlanoService retorna null para 'admin' → trata como ilimitado)
```

Regra: se `$usuario->hasRole('admin')` → pular verificação de limite completamente.

### ChatService — modificações:
1. Injetar `PlanoService` no construtor: `private PlanoService $planoService`
2. Remover as constantes `LIMITES_POR_PLANO` e `PLANOS_SEM_LIMITE`
3. Reescrever `verificarLimite()`:
```php
public function verificarLimite(User $usuario): void
{
    if ($usuario->hasRole('admin')) {
        return;
    }

    $slugPlano = $usuario->assinante?->plano ?? 'essencial';
    $limite = $this->planoService->limiteInteiro($slugPlano, 'chat_diario_limite');

    if ($limite === null) {
        return; // ilimitado
    }

    $dataBrasilia = now()->timezone('America/Sao_Paulo')->format('Y-m-d');
    $chaveRedis   = "chat_limite_{$usuario->id}_{$dataBrasilia}";
    $contagem = (int) Redis::get($chaveRedis);

    if ($contagem >= $limite) {
        throw new TooManyRequestsHttpException(
            null,
            "Limite de {$limite} perguntas/dia atingido. Faça upgrade para continuar.",
        );
    }
}
```

### RelatorioIaService — modificações:
1. Injetar `PlanoService` no construtor: `private PlanoService $planoService`
2. Remover as constantes `LIMITES_POR_PLANO` e `PLANOS_SEM_LIMITE`
3. Reescrever `verificarLimite()` seguindo o mesmo padrão, mas usando chave `relatorio_mensal_limite`

### CarteiraRiscoController — modificações:
1. Injetar `PlanoService` no construtor: `private readonly PlanoService $planoService`
2. Reescrever `verificarAcessoRiskScore()`:
```php
private function verificarAcessoRiskScore(): void
{
    $usuario = auth()->user();
    
    if ($usuario->hasRole('admin')) {
        return;
    }

    $slugPlano = $usuario->assinante?->plano ?? 'essencial';
    $temAcesso = $this->planoService->recursoBoolean($slugPlano, 'risk_score');

    if (! $temAcesso) {
        abort(403, 'Risk Score disponível apenas para planos Pro e Reservado.');
    }
}
```

## Regras
- Seguir padrões da skill laravel-arquitetura
- Controller continua fino — a lógica do check pode ficar no controller como método privado (é autorização, não negócio), mas deve usar PlanoService
- Código em português
- Não alterar nenhuma outra lógica dos services além dos métodos de verificação de limite/acesso
