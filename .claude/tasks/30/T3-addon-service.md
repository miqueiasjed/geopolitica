# T3 – Refatorar AddonService::resolverAddonKey()

## Objetivo
Substituir a leitura de `config("addons.{$fonte}_products")` por uma query no banco de dados,
buscando o `Produto` pelo campo `product_id_{$fonte}` e retornando sua `chave`.

## Arquivo a editar
`backend/app/Services/AddonService.php`

## Mudança em resolverAddonKey()

### Antes:
```php
public static function resolverAddonKey(string $productId, string $fonte): ?string
{
    $mapa = config("addons.{$fonte}_products");

    if (! is_array($mapa)) {
        return null;
    }

    return $mapa[$productId] ?? null;
}
```

### Depois:
```php
public static function resolverAddonKey(string $productId, string $fonte): ?string
{
    $campo = "product_id_{$fonte}";

    return Produto::query()
        ->where($campo, $productId)
        ->value('chave');
}
```

## Import necessário
Adicionar `use App\Models\Produto;` no topo do arquivo.

## Verificação
- Método `resolverAddonKey` não usa mais `config()` para `_products`
- `resolverPlanoByOferta` permanece intacto (ainda usa config para `lastlink_offers`)
- Arquivo importa `App\Models\Produto`
