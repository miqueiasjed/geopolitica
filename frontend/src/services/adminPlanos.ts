import api from '../lib/axios'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PlanoRecursoItem = string | null

export interface Plano {
  id: number
  slug: string
  nome: string
  descricao: string | null
  preco: string
  ordem: number
  ativo: boolean
  lastlink_url: string | null
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
): Promise<void> {
  await api.put(`/admin/planos/${planoId}/recursos/${chave}`, { valor })
}

export async function atualizarPlano(
  planoId: number,
  dados: { nome: string; descricao: string | null; preco: number; lastlink_url: string | null },
): Promise<void> {
  await api.put(`/admin/planos/${planoId}`, dados)
}

export async function criarPlano(dados: {
  slug: string
  nome: string
  descricao: string | null
  preco: number
  ordem: number
  ativo: boolean
  lastlink_url: string | null
}): Promise<Plano> {
  const res = await api.post<{ data: Plano }>('/admin/planos', dados)
  return res.data.data
}
