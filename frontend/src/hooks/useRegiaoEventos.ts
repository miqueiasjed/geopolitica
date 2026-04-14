import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Event } from '../types/feed'

export const regiaoEventosKeys = {
  all: ['regiao-eventos'] as const,
  byRegiao: (regiao: string) => [...regiaoEventosKeys.all, regiao] as const,
}

async function fetchRegiaoEventos(regiao: string): Promise<Event[]> {
  const response = await api.get<Event[]>('/mapa/regiao-eventos', {
    params: { regiao },
  })
  return response.data
}

export function useRegiaoEventos(regiao: string | null) {
  const query = useQuery({
    queryKey: regiao ? regiaoEventosKeys.byRegiao(regiao) : regiaoEventosKeys.all,
    queryFn: () => fetchRegiaoEventos(regiao!),
    enabled: !!regiao,
    staleTime: 2 * 60 * 1000,
  })

  const eventos: Event[] = query.data ?? []

  return {
    eventos,
    isLoading: query.isLoading,
  }
}
