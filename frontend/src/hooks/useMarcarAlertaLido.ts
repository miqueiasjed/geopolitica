import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { alertasKeys } from './useAlertas'

async function postAlertaLido(id: number): Promise<void> {
  try {
    await api.post(`/alertas/${id}/lido`)
  } catch (erro: unknown) {
    // 409 = já marcado como lido — trata silenciosamente
    const status = (erro as { response?: { status?: number } })?.response?.status
    if (status === 409) return
    throw erro
  }
}

export function useMarcarAlertaLido() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: postAlertaLido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertasKeys.all })
    },
  })

  return {
    marcarLido: (id: number) => mutation.mutate(id),
    isPending: mutation.isPending,
  }
}
