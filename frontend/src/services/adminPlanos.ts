import api from '../lib/axios'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PlanoRecursoItem = string | null

export interface OfertaPlano {
  id: number
  fonte: 'hotmart' | 'lastlink'
  offer_id: string
  descricao: string
  plano: string
  created_at: string
}

export interface Plano {
  id: number
  slug: string
  nome: string
  descricao: string | null
  preco: string
  ordem: number
  ativo: boolean
  exibir_no_upgrade: boolean
  lastlink_url: string | null
  role: string | null
  product_id_hotmart: string | null
  product_id_lastlink: string | null
  recursos: Record<string, PlanoRecursoItem>
}

export interface RoleItem {
  role: string
  label: string
  assinante: boolean
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminPlanosKeys = {
  all: ['admin', 'planos'] as const,
  lista: () => [...adminPlanosKeys.all] as const,
  roles: () => ['admin', 'roles'] as const,
  ofertas: (slug: string) => ['admin', 'planos', 'ofertas', slug] as const,
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
  dados: {
    nome: string
    descricao: string | null
    preco: number
    ordem?: number
    ativo?: boolean
    exibir_no_upgrade?: boolean
    lastlink_url: string | null
    role: string | null
    product_id_hotmart: string | null
    product_id_lastlink: string | null
  },
): Promise<void> {
  await api.put(`/admin/planos/${planoId}`, dados)
}

export async function fetchRoles(): Promise<RoleItem[]> {
  const res = await api.get<{ data: RoleItem[] }>('/admin/usuarios/roles')
  return res.data.data
}

export async function fetchOfertasPorPlano(slug: string): Promise<OfertaPlano[]> {
  const res = await api.get<{ data: OfertaPlano[] }>('/admin/webhook-offer-planos', {
    params: { plano: slug },
  })
  return res.data.data
}

export async function criarOferta(dados: {
  fonte: 'hotmart' | 'lastlink'
  offer_id: string
  descricao: string
  plano: string
}): Promise<OfertaPlano> {
  const res = await api.post<{ data: OfertaPlano }>('/admin/webhook-offer-planos', dados)
  return res.data.data
}

export async function deletarOferta(id: number): Promise<void> {
  await api.delete(`/admin/webhook-offer-planos/${id}`)
}

export async function criarPlano(dados: {
  slug: string
  nome: string
  descricao: string | null
  preco: number
  ordem: number
  ativo: boolean
  exibir_no_upgrade?: boolean
  lastlink_url: string | null
}): Promise<Plano> {
  const res = await api.post<{ data: Plano }>('/admin/planos', dados)
  return res.data.data
}

export async function excluirPlano(planoId: number): Promise<void> {
  await api.delete(`/admin/planos/${planoId}`)
}
