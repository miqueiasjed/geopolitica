import api from '../lib/axios'
import type { MembroB2B, AceitarConvitePayload, AceitarConviteResponse } from '../types/b2b'

export const equipeKeys = {
  all: ['equipe'] as const,
  membros: () => [...equipeKeys.all, 'membros'] as const,
}

export interface EquipeResponse {
  membros: MembroB2B[]
  total: number
  max_usuarios: number
}

export async function fetchEquipe(): Promise<EquipeResponse> {
  const res = await api.get<EquipeResponse>('/empresa/equipe')
  return res.data
}

export interface ConvidarMembroPayload {
  email: string
  role_b2b: 'leitor' | 'admin'
}

export async function convidarMembro(payload: ConvidarMembroPayload): Promise<void> {
  await api.post('/empresa/convidar', payload)
}

export async function removerMembro(id: number): Promise<void> {
  await api.delete(`/empresa/membros/${id}`)
}

export async function aceitarConvite(token: string, payload: AceitarConvitePayload): Promise<AceitarConviteResponse> {
  const resposta = await api.post<AceitarConviteResponse>(`/convite/${token}/aceitar`, payload)
  return resposta.data
}
