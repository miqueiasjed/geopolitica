import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { IndicadorHistoricoItem, IndicadorHistoricoResponse } from '../types/indicadores'

const SIMBOLOS_PERMITIDOS = new Set(['CL=F', 'BZ=F', 'USDBRL=X', 'NG=F', 'HG=F', 'ALI=F', 'ZW=F', 'ZC=F', 'KC=F'])

export const indicadorHistoricoKeys = {
  all: ['indicador-historico'] as const,
  bySymbol: (simbolo: string) => [...indicadorHistoricoKeys.all, simbolo] as const,
}

async function fetchIndicadorHistorico(simbolo: string): Promise<IndicadorHistoricoItem[]> {
  const response = await api.get<IndicadorHistoricoResponse>('/indicadores/historico', {
    params: { simbolo: simbolo.trim() },
  })
  return response.data.historico
}

export function useIndicadorHistorico(simbolo: string, enabled?: boolean) {
  const simboloNormalizado = simbolo.trim()
  const podeBuscar = enabled !== false && SIMBOLOS_PERMITIDOS.has(simboloNormalizado)

  const query = useQuery({
    queryKey: indicadorHistoricoKeys.bySymbol(simboloNormalizado),
    queryFn: () => fetchIndicadorHistorico(simboloNormalizado),
    enabled: podeBuscar,
  })

  const historico: IndicadorHistoricoItem[] = query.data ?? []

  return {
    ...query,
    historico,
  }
}
