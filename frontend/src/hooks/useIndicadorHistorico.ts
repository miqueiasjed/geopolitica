import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { IndicadorHistoricoItem, IndicadorHistoricoResponse } from '../types/indicadores'

export const indicadorHistoricoKeys = {
  all: ['indicador-historico'] as const,
  bySymbol: (simbolo: string) => [...indicadorHistoricoKeys.all, simbolo] as const,
}

async function fetchIndicadorHistorico(simbolo: string): Promise<IndicadorHistoricoItem[]> {
  const response = await api.get<IndicadorHistoricoResponse>('/indicadores/historico', {
    params: { simbolo },
  })
  return response.data.historico
}

export function useIndicadorHistorico(simbolo: string, enabled?: boolean) {
  const query = useQuery({
    queryKey: indicadorHistoricoKeys.bySymbol(simbolo),
    queryFn: () => fetchIndicadorHistorico(simbolo),
    enabled: enabled !== false,
  })

  const historico: IndicadorHistoricoItem[] = query.data ?? []

  return {
    ...query,
    historico,
  }
}
