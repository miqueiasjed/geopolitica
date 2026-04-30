import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Editorial, Event } from '../types/feed'

interface EventResponse {
  data: Event
}

interface EditorialResponse {
  headline: string
  legenda: string
}

async function fetchEvent(id: string): Promise<Event> {
  const res = await api.get<EventResponse>(`/feed/${id}`)
  return res.data.data
}

async function gerarEditorial(id: string): Promise<Editorial> {
  const res = await api.post<EditorialResponse>(`/feed/${id}/editorial`)
  return res.data
}

export function useEventDetail(id: string) {
  return useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
  })
}

export function useGerarEditorial(id: string) {
  return useMutation<Editorial>({
    mutationFn: () => gerarEditorial(id),
  })
}
