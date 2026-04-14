import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { BibliotecaFiltros, BibliotecaResponse, ConteudoCard } from '../types/biblioteca'

export const bibliotecaKeys = {
  all: ['biblioteca'] as const,
  list: (filtros: BibliotecaFiltros) => [...bibliotecaKeys.all, filtros] as const,
}

async function fetchBiblioteca({
  cursor,
  filtros,
}: {
  cursor?: number | null
  filtros: BibliotecaFiltros
}): Promise<BibliotecaResponse> {
  const response = await api.get<BibliotecaResponse>('/biblioteca', {
    params: {
      ...filtros,
      cursor: cursor ?? undefined,
    },
  })

  return response.data
}

export function useBiblioteca(filtros: BibliotecaFiltros) {
  const query = useInfiniteQuery({
    queryKey: bibliotecaKeys.list(filtros),
    queryFn: ({ pageParam }) => fetchBiblioteca({ cursor: pageParam, filtros }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 5 * 60 * 1000,
  })

  const conteudos: ConteudoCard[] = query.data?.pages.flatMap((page) => page.data) ?? []

  return {
    conteudos,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
