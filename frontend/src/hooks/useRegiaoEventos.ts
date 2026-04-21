import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Event } from '../types/feed'

interface RegiaoEventosResponse {
  data: Event[]
}

export const regiaoEventosKeys = {
  all: ['regiao-eventos'] as const,
  byRegiao: (regiao: string) => [...regiaoEventosKeys.all, regiao] as const,
}

async function fetchRegiaoEventos(regiao: string): Promise<Event[]> {
  const response = await api.get<Event[] | RegiaoEventosResponse>('/mapa/regiao-eventos', {
    params: { regiao },
  })

  if (Array.isArray(response.data)) {
    return response.data
  }

  return Array.isArray(response.data.data) ? response.data.data : []
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
