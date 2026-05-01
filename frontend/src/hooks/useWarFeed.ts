import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Event } from '../types/feed'

interface WarFeedPage {
  events: Event[]
  nextCursor: string | null
}

export const warFeedKeys = {
  all: ['war-feed'] as const,
}

async function fetchWarFeed({ cursor }: { cursor?: string | null }): Promise<WarFeedPage> {
  const response = await api.get<WarFeedPage>('/war-feed', {
    params: {
      cursor: cursor ?? undefined,
      limit: 20,
    },
  })

  return response.data
}

export function useWarFeed(enabled = true) {
  const query = useInfiniteQuery({
    queryKey: warFeedKeys.all,
    queryFn: ({ pageParam }) => fetchWarFeed({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 5 * 60 * 1000,
    enabled,
  })

  const events: Event[] = query.data?.pages.flatMap((page) => page.events) ?? []

  return {
    ...query,
    events,
  }
}
