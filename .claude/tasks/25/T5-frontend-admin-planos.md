# T5 – Frontend: AdminPlanos.tsx + rota + sidebar

## Objetivo
Criar a página `AdminPlanos.tsx` no admin para visualizar e editar os planos e seus recursos via API.

## Dependência
T4 deve estar concluída (API `/admin/planos` funcionando).

## Arquivos a criar/modificar

### 1. Service: `frontend/src/services/adminPlanos.ts`

Tipos TypeScript:
```ts
export interface PlanoRecursoItem {
  valor: string | null
  ativo: boolean
}

export interface Plano {
  id: number
  slug: string
  nome: string
  descricao: string | null
  preco: string
  ordem: number
  ativo: boolean
  recursos: Record<string, PlanoRecursoItem>
}

export const adminPlanosKeys = {
  all: ['admin', 'planos'] as const,
  lista: () => [...adminPlanosKeys.all] as const,
}

export async function fetchPlanos(): Promise<Plano[]>
export async function atualizarRecurso(planoId: number, chave: string, valor: string | null, ativo: boolean): Promise<void>
export async function atualizarPlano(planoId: number, dados: { nome: string; descricao: string | null; preco: number }): Promise<void>
```

Usar `api` do `../../lib/axios` para todas as chamadas (padrão do projeto).

### 2. Página: `frontend/src/pages/admin/AdminPlanos.tsx`

#### Layout geral
- Header com título "Planos & Recursos"
- 3 colunas (uma por plano): Essencial | Pro | Reservado
- Cada coluna mostra o nome do plano e todos os recursos editáveis

#### Componente de recurso
Para cada recurso dentro de um plano, mostrar:
- **Label** (humanizada do chave): ex. `chat_diario_limite` → "Chat (por dia)"
- **Tipo do recurso** (inferido pela chave):
  - Se contém 'acesso', 'monitor', 'risk_score', 'biblioteca' → boolean (toggle switch)
  - Se contém '_limite', '_dias' → número ou null (campo numérico + checkbox "Ilimitado")
  - Se é 'alertas_nivel' → select com opções: 'medium', 'medium,high', 'all'
- **Toggle de ativo** (ativo/inativo) → ao desativar, o recurso fica bloqueado para todos do plano

#### Mapeamento de labels (humanização)
```ts
const LABELS: Record<string, string> = {
  chat_diario_limite: 'Chat (por dia)',
  relatorio_mensal_limite: 'Relatórios IA (por mês)',
  feed_historico_dias: 'Histórico do Feed (dias)',
  conteudo_historico_dias: 'Conteúdo (histórico dias)',
  biblioteca_acesso: 'Acesso à Biblioteca',
  monitor_eleitoral: 'Monitor Eleitoral',
  monitor_guerra: 'Monitor de Guerra',
  risk_score: 'Risk Score de Portfólio',
  alertas_nivel: 'Nível de Alertas',
}
```

#### Comportamento de edição inline
- Ao clicar no valor de um recurso, ele fica editável in-place
- Botão "Salvar" faz o PUT para `/admin/planos/{planoId}/recursos/{chave}`
- Após salvar: `queryClient.invalidateQueries({ queryKey: adminPlanosKeys.lista() })`
- Estado de loading/erro visual durante a mutação

#### Indicadores visuais
- Valor `null` → exibir badge "Ilimitado" em verde
- Valor `'false'` → exibir badge "Desativado" em vermelho/cinza
- Valor `'true'` → exibir badge "Ativo" em verde
- Valores numéricos → exibir o número com unidade (ex: "5/dia", "20/dia", "90 dias")

#### Cores do design system
- Usar as cores existentes do projeto: `#0a0a0b` (bg), `#C9B882` (accent), `zinc-*`
- Seguir padrão dos outros admin pages (font-mono, uppercase, tracking)

### 3. Modificar: `frontend/src/components/AdminLayout.tsx`
Adicionar item de navegação:
```ts
{ label: 'Planos', rota: '/admin/planos', icone: LayersIcon }
```
Importar `LayersIcon` de `@radix-ui/react-icons` (ou usar `MixIcon` se LayersIcon não existir).

### 4. Modificar: `frontend/src/router/index.tsx`
Dentro do grupo de rotas admin, adicionar:
```tsx
import { AdminPlanos } from '../pages/admin/AdminPlanos'
// ...
<Route path="planos" element={<AdminPlanos />} />
```

## Regras
- Seguir padrões da skill frontend-design-system
- NUNCA usar fetch direto no componente — usar TanStack Query
- NUNCA usar `any` — tipar tudo
- Usar `api` do `lib/axios`
- Mutations com `useMutation` + invalidateQueries após sucesso
- Componente exportado como named export: `export function AdminPlanos()`
- Código em português (variáveis, funções, comentários)
