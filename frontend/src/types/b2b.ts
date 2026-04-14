export type RoleB2B = 'admin' | 'leitor'

export interface MembroB2BUsuario {
  name: string
}

export interface MembroB2B {
  id: number
  convite_email: string
  role_b2b: RoleB2B
  aceito_em: string | null
  usuario?: MembroB2BUsuario
}

// --- Admin B2B ---

export interface EmpresaB2B {
  id: number
  nome: string
  subdominio: string
  max_usuarios: number
  membros_ativos: number
  expira_em: string
  ativo: boolean
}

export interface CriarLicencaPayload {
  nome: string
  subdominio: string
  max_usuarios: number
  email_admin: string
  meses: 6 | 12 | 24
}

export interface RenovarLicencaPayload {
  meses: 6 | 12 | 24
}

// --- Convite ---

export interface AceitarConvitePayload {
  nome: string
  password: string
  password_confirmation: string
}

export interface AceitarConviteResponse {
  message: string
  subdominio: string
}
