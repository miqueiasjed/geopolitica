import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Event } from '../types/feed'

interface EventResponse {
  data: Event
}

async function fetchEvent(id: string): Promise<Event> {
  const res = await api.get<EventResponse>(`/feed/${id}`)
  return res.data.data
}

export function useEventDetail(id: string) {
  return useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
  })
}
