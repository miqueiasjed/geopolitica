import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { EventoPais } from '../types/pais'

interface EventosPaisResponse {
  data: EventoPais[]
}

export const eventosPaisKeys = {
  all: ['eventos-pais'] as const,
  lista: (codigoPais: string) => [...eventosPaisKeys.all, codigoPais] as const,
}

async function fetchEventosPais(codigoPais: string): Promise<EventoPais[]> {
  const resposta = await api.get<EventosPaisResponse>(`/paises/${codigoPais}/eventos`)
  return resposta.data.data
}

export function useEventosPais(codigoPais: string) {
  const query = useQuery({
    queryKey: eventosPaisKeys.lista(codigoPais),
    queryFn: () => fetchEventosPais(codigoPais),
    enabled: !!codigoPais,
    staleTime: 5 * 60 * 1000,
  })

  const eventos: EventoPais[] = query.data ?? []

  return {
    eventos,
    isLoading: query.isLoading,
    error: query.error,
  }
}
