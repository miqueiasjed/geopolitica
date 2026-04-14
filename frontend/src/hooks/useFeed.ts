import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Event, FeedFilters, FeedPage } from '../types/feed'

export const feedKeys = {
  all: ['feed'] as const,
  list: (filters: FeedFilters) => [...feedKeys.all, filters] as const,
}

async function fetchFeed({
  cursor,
  filters,
}: {
  cursor?: string | null
  filters: FeedFilters
}): Promise<FeedPage> {
  const response = await api.get<FeedPage>('/feed', {
    params: {
      ...filters,
      cursor: cursor ?? undefined,
    },
  })

  return response.data
}

export function useFeed(filters: FeedFilters) {
  const query = useInfiniteQuery({
    queryKey: feedKeys.list(filters),
    queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam, filters }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.links.next_cursor ?? null,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
  })

  const events: Event[] = query.data?.pages.flatMap((page) => page.data) ?? []

  return {
    ...query,
    events,
  }
}
