import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Eleicao, FiltrosEleicao } from '../types/eleicao'

export const eleicoesKeys = {
  all: ['eleicoes'] as const,
  lista: (filtros: FiltrosEleicao) => [...eleicoesKeys.all, filtros] as const,
}

async function fetchEleicoes(filtros: FiltrosEleicao): Promise<Eleicao[]> {
  const params: Record<string, string | number> = { ano: filtros.ano }

  if (filtros.relevancia !== undefined) {
    params.relevancia = filtros.relevancia
  }

  const response = await api.get<{ data: Eleicao[] }>('/eleicoes', { params })
  return response.data.data
}

export function useEleicoes(filtros: FiltrosEleicao) {
  const query = useQuery({
    queryKey: eleicoesKeys.lista(filtros),
    queryFn: () => fetchEleicoes(filtros),
    refetchOnMount: 'always',
    staleTime: 60 * 60 * 1000,
  })

  const eleicoes: Eleicao[] = Array.isArray(query.data) ? query.data : []

  return {
    ...query,
    eleicoes,
  }
}
