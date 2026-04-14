export interface PaginacaoLaravel<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface AdminAssinante {
  id: number
  email: string
  name: string
  plano: string
  status: string
  ativo: boolean
  assinado_em: string | null
}

export interface AdminWebhookEvento {
  id: number
  event_type: string
  email: string | null
  processado: boolean
  created_at: string
  payload: unknown
}

export interface AdminAssinantesFiltros {
  search?: string
  plano?: string
  status?: string
  page?: number
}

export interface AdminWebhookEventosFiltros {
  type?: string
  processado?: string
  page?: number
}
