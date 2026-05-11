import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Event, FeedPage } from '../types/feed'
import { feedKeys } from './useFeed'

interface EventResponse {
  data: Event
}

async function fetchEvent(id: string): Promise<Event> {
  const res = await api.get<EventResponse>(`/feed/${id}`)
  return res.data.data
}

export function useEventDetail(id: string) {
  const queryClient = useQueryClient()

  return useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
    initialData: () => {
      const cached = queryClient.getQueriesData<{ pages: FeedPage[] }>({ queryKey: feedKeys.all })
      for (const [, data] of cached) {
        if (!data?.pages) continue
        for (const page of data.pages) {
          const event = page.data.find((e) => String(e.id) === id)
          if (event) return event
        }
      }
      return undefined
    },
  })
}
