import api from '../lib/axios'

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminPlanosKeys = {
  all: ['admin', 'planos'] as const,
  lista: () => [...adminPlanosKeys.all] as const,
}

// ─── Funções de API ───────────────────────────────────────────────────────────

export async function fetchPlanos(): Promise<Plano[]> {
  const res = await api.get<{ data: Plano[] }>('/admin/planos')
  return res.data.data
}

export async function atualizarRecurso(
  planoId: number,
  chave: string,
  valor: string | null,
  ativo: boolean,
): Promise<void> {
  await api.put(`/admin/planos/${planoId}/recursos/${chave}`, { valor, ativo })
}

export async function atualizarPlano(
  planoId: number,
  dados: { nome: string; descricao: string | null; preco: number },
): Promise<void> {
  await api.put(`/admin/planos/${planoId}`, dados)
}
