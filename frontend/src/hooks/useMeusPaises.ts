import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MutateOptions } from '@tanstack/react-query'
import api from '../lib/axios'
import type { PaisUsuario } from '../types/pais'

export const meusPaisesKeys = {
  all: ['meus-paises'] as const,
}

async function fetchMeusPaises(): Promise<PaisUsuario[]> {
  const resposta = await api.get<PaisUsuario[]>('/meus-paises')
  return resposta.data
}

async function postAdicionarPais(codigo_pais: string): Promise<void> {
  await api.post('/meus-paises', { codigo_pais })
}

async function deleteRemoverPais(codigo_pais: string): Promise<void> {
  await api.delete(`/meus-paises/${codigo_pais}`)
}

type OpcoesMutacao = MutateOptions<void, Error, string>

export function useMeusPaises() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: meusPaisesKeys.all,
    queryFn: fetchMeusPaises,
  })

  const mutacaoAdicionar = useMutation({
    mutationFn: postAdicionarPais,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meusPaisesKeys.all })
    },
  })

  const mutacaoRemover = useMutation({
    mutationFn: deleteRemoverPais,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meusPaisesKeys.all })
    },
  })

  const data: PaisUsuario[] = query.data ?? []

  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    adicionarPais: (codigo_pais: string, opcoes?: OpcoesMutacao) => mutacaoAdicionar.mutate(codigo_pais, opcoes),
    removerPais: (codigo_pais: string, opcoes?: OpcoesMutacao) => mutacaoRemover.mutate(codigo_pais, opcoes),
    isAdicionando: mutacaoAdicionar.isPending,
    isRemovendo: mutacaoRemover.isPending,
  }
}
