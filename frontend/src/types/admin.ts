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

export type StatusConteudo = 'publicado' | 'rascunho'

export interface AdminConteudoItem {
  id: number
  tipo: import('./biblioteca').TipoConteudo
  titulo: string
  plano_minimo: import('./biblioteca').PlanoMinimo
  status: StatusConteudo
  publicado_em: string | null
}

export interface AdminConteudosResponse {
  data: AdminConteudoItem[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export type RoleUsuario = 'admin' | 'assinante_essencial' | 'assinante_pro' | 'assinante_reservado' | 'company_admin'

export interface AdminUsuario {
  id: number
  name: string
  email: string
  role: RoleUsuario | null
  created_at: string
}

export interface AdminUsuarioDetalhe extends AdminUsuario {
  email_verified_at: string | null
  assinante: {
    plano: string
    ativo: boolean
    status: string
    expira_em: string | null
  } | null
}

export interface AdminUsuariosFiltros {
  search?: string
  role?: string
  page?: number
}

export interface AtualizarUsuarioPayload {
  name?: string
  email?: string
  role?: RoleUsuario
}
