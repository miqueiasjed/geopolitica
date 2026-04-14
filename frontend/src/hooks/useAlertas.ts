import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Alerta, AlertasResponse } from '../types/alertas'

export const alertasKeys = {
  all: ['alertas'] as const,
}

async function fetchAlertas(): Promise<AlertasResponse> {
  const resposta = await api.get<AlertasResponse>('/alertas')
  return resposta.data
}

export function useAlertas() {
  const query = useQuery({
    queryKey: alertasKeys.all,
    queryFn: fetchAlertas,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
  })

  const alertas: Alerta[] = query.data?.alertas ?? []
  const totalNaoLidos: number = query.data?.total_nao_lidos ?? 0

  return {
    alertas,
    totalNaoLidos,
    isLoading: query.isLoading,
  }
}
