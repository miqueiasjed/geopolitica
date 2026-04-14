import { useEffect, useRef } from 'react'
import { EmptyState } from './EmptyState'
import { EventCard } from './EventCard'
import { LoadingSpinner } from './LoadingSpinner'
import type { Event } from '../types/feed'

interface EventListProps {
  events: Event[]
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}

export function EventList({
  events,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: EventListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!events.length) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      <div ref={sentinelRef} aria-hidden="true" className="h-6 w-full" />

      {isFetchingNextPage ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      ) : null}
    </div>
  )
}
