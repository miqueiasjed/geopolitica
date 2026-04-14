import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { equipeKeys, fetchEquipe, removerMembro } from '../services/b2b'
import type { MembroB2B } from '../types/b2b'

export function useEquipe() {
  const query = useQuery({
    queryKey: equipeKeys.membros(),
    queryFn: fetchEquipe,
  })

  const membros: MembroB2B[] = query.data?.membros ?? []
  const total: number = query.data?.total ?? 0
  const maxUsuarios: number = query.data?.max_usuarios ?? 0

  return {
    membros,
    total,
    maxUsuarios,
    isLoading: query.isLoading,
  }
}

export function useRemoverMembro() {
  const queryClient = useQueryClient()

  const { mutate: remover, isPending } = useMutation({
    mutationFn: removerMembro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipeKeys.membros() })
    },
  })

  return { remover, isPending }
}
