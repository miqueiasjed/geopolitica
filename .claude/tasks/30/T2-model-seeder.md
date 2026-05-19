# T2 – Atualizar Produto model e ProdutoSeeder

## Objetivo
1. Adicionar `product_id_lastlink` e `product_id_hotmart` ao `$fillable` do model `Produto`
2. Atualizar `ProdutoSeeder` para popular esses campos com valores das env vars existentes

## Arquivos a editar

### backend/app/Models/Produto.php
Adicionar ao array `$fillable`:
```php
'product_id_lastlink',
'product_id_hotmart',
```

### backend/database/seeders/ProdutoSeeder.php
Adicionar nos dados dos produtos:
- Para `elections`: `'product_id_lastlink' => env('LASTLINK_PRODUCT_ELECTIONS'), 'product_id_hotmart' => env('HOTMART_PRODUCT_ELECTIONS')`
- Para `war`: `'product_id_lastlink' => env('LASTLINK_PRODUCT_WAR'), 'product_id_hotmart' => env('HOTMART_PRODUCT_WAR')`

## Observação
Os campos podem ser null se as env vars não estiverem definidas (é comportamento esperado em ambiente local).
