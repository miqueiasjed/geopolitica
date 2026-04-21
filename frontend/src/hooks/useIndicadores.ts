import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Indicador } from '../types/indicadores'

export const indicadoresKeys = {
  all: ['indicadores'] as const,
}

async function fetchIndicadores(): Promise<Indicador[]> {
  const response = await api.get<{ data: Indicador[] }>('/indicadores')
  return response.data.data
}

export function useIndicadores() {
  const query = useQuery({
    queryKey: indicadoresKeys.all,
    queryFn: fetchIndicadores,
    refetchInterval: 15 * 60 * 1000,
    refetchIntervalInBackground: true,
  })

  const indicadores: Indicador[] = query.data ?? []
  const ultimaAtualizacao = indicadores[0]?.atualizado_em ?? null

  return {
    ...query,
    indicadores,
    ultimaAtualizacao,
  }
}
