import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api from '../lib/axios'
import type { Event, FeedPage } from '../types/feed'
import { feedKeys } from './useFeed'
import { warFeedKeys } from './useWarFeed'

interface EventResponse {
  data: Event
}

interface WarFeedPage {
  events: Event[]
  nextCursor: string | null
}

async function fetchEvent(id: string, queryClient: ReturnType<typeof useQueryClient>): Promise<Event> {
  // Check war-feed cache to decide which endpoint to try first
  const warCached = queryClient.getQueriesData<{ pages: WarFeedPage[] }>({ queryKey: warFeedKeys.all })
  const isInWarCache = warCached.some(([, data]) =>
    data?.pages?.some((page) => page.events.some((e) => String(e.id) === id)),
  )

  if (isInWarCache) {
    const res = await api.get<EventResponse>(`/war-feed/${id}`)
    return res.data.data
  }

  try {
    const res = await api.get<EventResponse>(`/feed/${id}`)
    return res.data.data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 403) {
      const res = await api.get<EventResponse>(`/war-feed/${id}`)
      return res.data.data
    }
    throw err
  }
}

export function useEventDetail(id: string) {
  const queryClient = useQueryClient()

  return useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id, queryClient),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) return false
      return failureCount < 3
    },
    initialData: () => {
      // Check regular feed cache
      const feedCached = queryClient.getQueriesData<{ pages: FeedPage[] }>({ queryKey: feedKeys.all })
      for (const [, data] of feedCached) {
        if (!data?.pages) continue
        for (const page of data.pages) {
          const event = page.data.find((e) => String(e.id) === id)
          if (event) return event
        }
      }
      // Check war-feed cache
      const warCached = queryClient.getQueriesData<{ pages: WarFeedPage[] }>({ queryKey: warFeedKeys.all })
      for (const [, data] of warCached) {
        if (!data?.pages) continue
        for (const page of data.pages) {
          const event = page.events.find((e) => String(e.id) === id)
          if (event) return event
        }
      }
      return undefined
    },
  })
}
