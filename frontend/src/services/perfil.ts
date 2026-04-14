import api from '../lib/axios'
import type { AtualizarPerfilInput, UsuarioAutenticado } from '../types/auth'

export const perfilKeys = {
  all: ['perfil'] as const,
  me: ['perfil', 'me'] as const,
}

export async function buscarPerfil(): Promise<UsuarioAutenticado> {
  const resposta = await api.get<{ user: UsuarioAutenticado }>('/perfil')

  return resposta.data.user
}

export async function atualizarPerfil(payload: AtualizarPerfilInput): Promise<UsuarioAutenticado> {
  const resposta = await api.patch<{ user: UsuarioAutenticado }>('/perfil', payload)

  return resposta.data.user
}
