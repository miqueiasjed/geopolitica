import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'

export interface PlanoPublico {
  id: number
  slug: string
  nome: string
  recursos: Record<string, string | null>
}

export function usePlanosAtivos() {
  return useQuery<PlanoPublico[]>({
    queryKey: ['planos-ativos'],
    queryFn: async () => {
      const res = await api.get<{ data: PlanoPublico[] }>('/planos')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Filtra os planos que têm um determinado recurso booleano habilitado.
 */
export function planosComRecurso(planos: PlanoPublico[], chave: string): PlanoPublico[] {
  return planos.filter((p) => p.recursos[chave] === 'true')
}
