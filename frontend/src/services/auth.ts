import api from '../lib/axios'
import type {
  LoginInput,
  LoginResponse,
  RedefinirSenhaInput,
  SolicitarResetSenhaInput,
  UsuarioAutenticado,
} from '../types/auth'

export interface AlterarSenhaInicialInput {
  password: string
  password_confirmation: string
}

export async function login(payload: LoginInput): Promise<LoginResponse> {
  const resposta = await api.post<LoginResponse>('/auth/login', payload)

  return resposta.data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function consultarUsuarioAutenticado(): Promise<UsuarioAutenticado> {
  const resposta = await api.get<{ user: UsuarioAutenticado }>('/auth/me')

  return resposta.data.user
}

export async function solicitarResetSenha(payload: SolicitarResetSenhaInput) {
  const resposta = await api.post<{ message: string }>('/auth/senha/esqueci', payload)

  return resposta.data
}

export async function redefinirSenha(payload: RedefinirSenhaInput) {
  const resposta = await api.post<{ message: string }>('/auth/senha/redefinir', payload)

  return resposta.data
}

export async function alterarSenhaInicial(payload: AlterarSenhaInicialInput) {
  const resposta = await api.post<{ message: string }>('/auth/senha/alterar-inicial', payload)

  return resposta.data
}
