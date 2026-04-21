import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { CriseHistorica, EventoTimeline, FiltrosTimeline, TimelineData } from '../types/timeline'

export const timelineKeys = {
  all: ['timeline'] as const,
  list: (filtros: FiltrosTimeline) => [...timelineKeys.all, filtros] as const,
}

async function fetchTimeline(filtros: FiltrosTimeline): Promise<TimelineData> {
  const params: Record<string, string> = {}

  if (filtros.periodo_inicio !== undefined) {
    params.periodo_inicio = String(filtros.periodo_inicio)
  }
  if (filtros.periodo_fim !== undefined) {
    params.periodo_fim = String(filtros.periodo_fim)
  }
  if (filtros.categoria !== undefined) {
    params.categoria = filtros.categoria
  }

  const response = await api.get<TimelineData>('/timeline', { params })
  return response.data
}

export function useTimeline(filtros: FiltrosTimeline = {}) {
  const query = useQuery({
    queryKey: timelineKeys.list(filtros),
    queryFn: () => fetchTimeline(filtros),
    staleTime: 30 * 60 * 1000,
  })

  const crises: CriseHistorica[] = Array.isArray(query.data?.crises) ? query.data.crises : []
  const eventos: EventoTimeline[] = Array.isArray(query.data?.eventos) ? query.data.eventos : []

  return {
    crises,
    eventos,
    isLoading: query.isLoading,
    error: query.error,
  }
}
