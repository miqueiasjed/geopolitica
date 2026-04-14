export interface Assinante {
  id: number
  plano: string
  ativo: boolean
  status: string
  hotmart_subscriber_code?: string | null
  assinado_em?: string | null
  expira_em?: string | null
}

export interface UsuarioAutenticado {
  id: number
  name: string
  email: string
  role: string | null
  assinante?: Assinante | null
}

export interface AuthState {
  user: UsuarioAutenticado | null
  token: string | null
  isAuthenticated: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UsuarioAutenticado
}

export interface SolicitarResetSenhaInput {
  email: string
}

export interface RedefinirSenhaInput {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface AtualizarPerfilInput {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
}
