# T4 – Atualizar FormRequests e config/addons.php

## Objetivo
1. Adicionar validação para `product_id_lastlink` e `product_id_hotmart` nos FormRequests
2. Remover entradas `hotmart_products` e `lastlink_products` de `config/addons.php`

## Arquivos a editar

### backend/app/Http/Requests/Admin/CriarProdutoRequest.php
Adicionar ao array `rules()`:
```php
'product_id_lastlink' => ['nullable', 'string', 'max:100', Rule::unique('produtos', 'product_id_lastlink')],
'product_id_hotmart'  => ['nullable', 'string', 'max:100', Rule::unique('produtos', 'product_id_hotmart')],
```

### backend/app/Http/Requests/Admin/AtualizarProdutoRequest.php
Adicionar ao array `rules()`:
```php
'product_id_lastlink' => ['nullable', 'string', 'max:100', Rule::unique('produtos', 'product_id_lastlink')->ignore($this->route('produto'))],
'product_id_hotmart'  => ['nullable', 'string', 'max:100', Rule::unique('produtos', 'product_id_hotmart')->ignore($this->route('produto'))],
```

Adicionar import em ambos os arquivos se não existir:
```php
use Illuminate\Validation\Rule;
```

### backend/config/addons.php
Remover as chaves `hotmart_products` e `lastlink_products` do array retornado.
Manter apenas a chave `lastlink_offers` (que ainda é usada por `resolverPlanoByOferta`).

Resultado esperado:
```php
<?php

return [
    // Offer codes = os códigos de checkout da Lastlink (ex: C110B44EE da URL /p/C110B44EE/)
    'lastlink_offers' => [
        env('LASTLINK_OFFER_ESSENCIAL')   => 'essencial',
        env('LASTLINK_OFFER_PRO')         => 'pro',
        env('LASTLINK_OFFER_RESERVADO')   => 'reservado',
        env('LASTLINK_OFFER_RESERVADO_2') => 'reservado',
    ],
];
```

## Verificação
- `CriarProdutoRequest` tem `Rule` importado e valida os dois novos campos com `unique`
- `AtualizarProdutoRequest` tem `Rule` importado e valida com `unique()->ignore()` para evitar falso positivo ao editar o mesmo produto
- `config/addons.php` sem `hotmart_products` e `lastlink_products`
