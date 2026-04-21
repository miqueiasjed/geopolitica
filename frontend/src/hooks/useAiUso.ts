import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { AiUsoData } from '../types/ai'

async function fetchAiUso(): Promise<AiUsoData> {
  const resposta = await api.get<{ data: AiUsoData }>('/admin/ai/uso')
  return resposta.data.data
}

export function useAiUso() {
  return useQuery<AiUsoData>({
    queryKey: ['admin', 'ai', 'uso'],
    queryFn: fetchAiUso,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}
