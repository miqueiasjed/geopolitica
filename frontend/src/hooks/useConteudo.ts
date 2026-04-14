import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api from '../lib/axios'
import type { Conteudo } from '../types/biblioteca'

export const conteudoKeys = {
  all: ['conteudo'] as const,
  detail: (slug: string) => [...conteudoKeys.all, slug] as const,
}

async function fetchConteudo(slug: string): Promise<Conteudo | null> {
  try {
    const response = await api.get<Conteudo>(`/biblioteca/${slug}`)
    return response.data
  } catch (err) {
    const error = err as AxiosError
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export function useConteudo(slug: string) {
  const query = useQuery({
    queryKey: conteudoKeys.detail(slug),
    queryFn: () => fetchConteudo(slug),
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(slug),
  })

  const isPlanGate = query.data === null && !query.isError

  return {
    conteudo: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isPlanGate,
  }
}
