import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { CriseHistoricaDetalhe } from '../types/timeline'

export const criseDetalheKeys = {
  all: ['crise-detalhe'] as const,
  detail: (slug: string) => [...criseDetalheKeys.all, slug] as const,
}

async function fetchCriseDetalhe(slug: string): Promise<CriseHistoricaDetalhe> {
  const response = await api.get<CriseHistoricaDetalhe>(`/timeline/crise/${slug}`)
  return response.data
}

export function useCriseDetalhe(slug: string | null) {
  const query = useQuery({
    queryKey: criseDetalheKeys.detail(slug ?? ''),
    queryFn: () => fetchCriseDetalhe(slug!),
    enabled: !!slug,
    staleTime: 24 * 60 * 60 * 1000,
  })

  return {
    crise: query.data as CriseHistoricaDetalhe | undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}
