import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { MapaData, PaisIntensidade } from '../types/mapa'

export const mapaKeys = {
  all: ['mapa-intensidade'] as const,
}

async function fetchMapaIntensidade(): Promise<MapaData> {
  const response = await api.get<MapaData>('/mapa/intensidade')
  return response.data
}

export function useMapaIntensidade() {
  const query = useQuery({
    queryKey: mapaKeys.all,
    queryFn: fetchMapaIntensidade,
    refetchOnMount: 'always',
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  })

  const paises: PaisIntensidade[] = query.data?.paises ?? []

  return {
    paises,
    isLoading: query.isLoading,
    error: query.error,
  }
}
