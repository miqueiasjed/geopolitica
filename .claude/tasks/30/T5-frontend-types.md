# T5 – Atualizar tipos TypeScript

## Objetivo
Adicionar `product_id_lastlink` e `product_id_hotmart` ao tipo `AdminProduto` e aos payloads de criar/atualizar.

## Arquivo a editar
`frontend/src/types/produto.ts`

## Mudanças

### Interface AdminProduto
Adicionar após `ordem: number`:
```typescript
product_id_lastlink: string | null
product_id_hotmart: string | null
```

### Interface CriarProdutoPayload
Adicionar como campos opcionais:
```typescript
product_id_lastlink?: string | null
product_id_hotmart?: string | null
```

### Type AtualizarProdutoPayload
É derivado de `CriarProdutoPayload` via `Omit<CriarProdutoPayload, 'chave'>`, portanto os novos campos serão incluídos automaticamente. Nenhuma alteração extra necessária.

## Verificação
- `AdminProduto` tem os dois novos campos como `string | null`
- `CriarProdutoPayload` tem os dois campos como opcionais
- `AtualizarProdutoPayload` herda os campos automaticamente via Omit
