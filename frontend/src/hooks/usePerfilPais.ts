import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { PerfilPais } from '../types/pais'

export const perfilPaisKeys = {
  all: ['perfil-pais'] as const,
  detalhe: (codigoPais: string) => [...perfilPaisKeys.all, codigoPais] as const,
}

async function fetchPerfilPais(codigoPais: string): Promise<PerfilPais> {
  const resposta = await api.get<PerfilPais>(`/paises/${codigoPais}`)
  return resposta.data
}

export function usePerfilPais(codigoPais: string) {
  const query = useQuery({
    queryKey: perfilPaisKeys.detalhe(codigoPais),
    queryFn: () => fetchPerfilPais(codigoPais),
    enabled: !!codigoPais,
    staleTime: 30 * 60 * 1000,
  })

  return {
    perfil: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
