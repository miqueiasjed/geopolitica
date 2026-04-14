---
name: frontend-design-system
description: Padrões do frontend React para o projeto Geopolitica para Investidores. Stack: React 19 + Vite + TypeScript + TailwindCSS 4 + Radix UI + TanStack Query + React Router v7.
---
# Skill: Frontend – Geopolitica para Investidores

Você está trabalhando no frontend React do projeto Geopolitica para Investidores.

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + Vite + TypeScript |
| Estilização | TailwindCSS 4 |
| Componentes acessíveis | Radix UI |
| Roteamento | React Router v7 |
| Estado servidor | TanStack React Query v5 |
| Animações | Framer Motion |
| Mapa mundial | React Simple Maps (SVG) |
| Escala de cores | D3 |
| Autenticação | Bearer token em `localStorage` |

---

## 1. Estrutura de pastas

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── ui/           # Primitivos (Button, Card, Badge, Input, Modal…)
│   │   └── [modulo]/     # Componentes específicos de cada módulo
│   ├── pages/            # Páginas por rota
│   ├── hooks/            # Custom hooks
│   ├── services/         # Funções de chamada à API (fetch + TanStack Query keys)
│   ├── utils/            # Helpers (formatDate, formatNumber…)
│   ├── types/            # Tipos TypeScript globais
│   └── router/           # Definição de rotas (React Router v7)
```

---

## 2. Regras de componentes

- Componentes em `src/components/ui/` são genéricos e reutilizáveis — **nunca** conter lógica de negócio.
- Componentes de módulo ficam em `src/components/[modulo]/` (ex: `src/components/feed/`, `src/components/mapa/`).
- **Nunca** usar `div` onde existe componente Radix UI adequado (Dialog, Tooltip, Select, etc.).
- Sempre tipar props com interfaces TypeScript explícitas — nunca usar `any`.
- Arquivos de componente: `PascalCase.tsx`. Hooks: `useCamelCase.ts`. Utilitários: `camelCase.ts`.

---

## 3. TanStack Query — padrão de data fetching

```tsx
// services/eventos.ts — definição da query
export const eventosKeys = {
  all: ['eventos'] as const,
  lista: (filtros: FiltrosEvento) => [...eventosKeys.all, 'lista', filtros] as const,
};

export async function fetchEventos(filtros: FiltrosEvento): Promise<Evento[]> {
  const res = await fetch(`/api/eventos?${new URLSearchParams(filtros as any)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Erro ao buscar eventos');
  return res.json();
}

// Em um hook personalizado
export function useEventos(filtros: FiltrosEvento) {
  return useQuery({
    queryKey: eventosKeys.lista(filtros),
    queryFn: () => fetchEventos(filtros),
  });
}
```

**Regras de Query:**
- Sempre definir `queryKey` usando factory functions no arquivo de service.
- Nunca usar `fetch` diretamente dentro de componente — sempre via hook.
- Mutations usam `useMutation` + `queryClient.invalidateQueries` após sucesso.

---

## 4. Autenticação

- Token Bearer armazenado em `localStorage` com chave `gpi_token`.
- Toda requisição autenticada adiciona o header: `Authorization: Bearer <token>`.
- Criar um helper centralizado `src/services/api.ts` para todas as chamadas autenticadas.

```ts
// src/services/api.ts
export async function apiFetch(path: string, init?: RequestInit) {
  const token = localStorage.getItem('gpi_token');
  return fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...init?.headers,
    },
  });
}
```

---

## 5. Roteamento (React Router v7)

- Rotas definidas em `src/router/index.tsx`.
- Páginas protegidas usam um componente `<RotaProtegida>` que verifica o token.
- Rotas por papel: verificar role do usuário (vindo da API após login) antes de renderizar.

```tsx
// Estrutura básica de rota protegida
<Route element={<RotaProtegida roles={['pro', 'reservado', 'admin']} />}>
  <Route path="/alertas" element={<AlertasPreditivos />} />
</Route>
```

---

## 6. Estilização com TailwindCSS 4

- **Nunca usar cores hardcoded** como `bg-blue-500` para elementos de marca — usar variáveis CSS ou tokens definidos no projeto.
- Modo dark: usar variante `dark:` do Tailwind.
- Responsividade: mobile-first (`sm:`, `md:`, `lg:`).
- Classes utilitárias de animação: usar via Framer Motion (ver skill `animacoes-motion`), não `animate-*` do Tailwind para elementos de UI.

---

## 7. Acessibilidade

- Usar componentes Radix UI para todos os elementos interativos complexos (modais, dropdowns, tooltips, tabs).
- Todo elemento interativo custom deve ter `aria-label` ou conteúdo textual acessível.
- Contraste de cores mínimo: WCAG AA (4.5:1 para texto normal).

---

## 8. O que NUNCA fazer

| ❌ Proibido | ✅ Correto |
|------------|-----------|
| `fetch()` diretamente em componente | Usar hook via TanStack Query |
| `useState` para dados do servidor | `useQuery` do TanStack Query |
| Lógica de negócio dentro do componente | Extrair para hook ou service |
| Tipo `any` | Tipar explicitamente com interface |
| Inline styles (`style={{ color: 'red' }}`) | Classes Tailwind |
| `console.log` em produção | Remover antes de commitar |
