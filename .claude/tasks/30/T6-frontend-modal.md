# T6 – Atualizar AdminProdutos.tsx (modal com campos de product_id)

## Objetivo
Adicionar inputs "ID Lastlink" e "ID Hotmart" no modal de criar/editar produto.

## Arquivo a editar
`frontend/src/pages/admin/AdminProdutos.tsx`

## Mudanças

### 1. Estado do form (ModalProduto)
Adicionar ao objeto `useState` do form:
```typescript
product_id_lastlink: produto?.product_id_lastlink ?? '',
product_id_hotmart:  produto?.product_id_hotmart ?? '',
```

### 2. Payload de submissão (mutationFn)
No payload de **criar** (`CriarProdutoPayload`), adicionar:
```typescript
product_id_lastlink: form.product_id_lastlink.trim() || null,
product_id_hotmart:  form.product_id_hotmart.trim() || null,
```

No payload de **atualizar** (`AtualizarProdutoPayload`), adicionar os mesmos campos.

### 3. Inputs no Body do modal
Adicionar após a seção "Links" (grid com link_compra e link_reativar) e antes do grid "Ordem + Ativo":

```tsx
{/* IDs de Pagamento */}
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  <div className="space-y-1.5">
    <label
      htmlFor="produto-lastlink-id"
      className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
    >
      ID Lastlink
    </label>
    <input
      id="produto-lastlink-id"
      type="text"
      value={form.product_id_lastlink}
      onChange={e => set('product_id_lastlink', e.target.value)}
      placeholder="ex: 98765"
      className={CAMPO}
    />
    {erros.product_id_lastlink && (
      <p className="font-mono text-[11px] text-red-400">{erros.product_id_lastlink}</p>
    )}
  </div>
  <div className="space-y-1.5">
    <label
      htmlFor="produto-hotmart-id"
      className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
    >
      ID Hotmart
    </label>
    <input
      id="produto-hotmart-id"
      type="text"
      value={form.product_id_hotmart}
      onChange={e => set('product_id_hotmart', e.target.value)}
      placeholder="ex: 12345"
      className={CAMPO}
    />
    {erros.product_id_hotmart && (
      <p className="font-mono text-[11px] text-red-400">{erros.product_id_hotmart}</p>
    )}
  </div>
</div>
```

## Verificação
- Modal tem dois novos inputs: "ID Lastlink" e "ID Hotmart"
- Inputs são populados com valores existentes ao editar
- Payloads de criar e atualizar incluem os novos campos
- Erros de validação do backend são exibidos abaixo dos inputs
- `npx tsc --noEmit` sem erros
