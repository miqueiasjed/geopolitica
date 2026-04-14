import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FilterBar } from '../components/FilterBar'
import { EventList } from '../components/EventList'
import { RefetchIndicator } from '../components/RefetchIndicator'
import { useFeed } from '../hooks/useFeed'
import type { FeedFilters } from '../types/feed'

interface DashboardOutletContext {
  setLastUpdatedLabel: (label: string) => void
}

function formatCountdown(dataUpdatedAt: number, referenceTime: number) {
  if (!dataUpdatedAt) {
    return 'Primeira sincronização pendente'
  }

  const nextUpdateAt = dataUpdatedAt + 5 * 60 * 1000
  const remainingMs = Math.max(nextUpdateAt - referenceTime, 0)
  const minutes = Math.floor(remainingMs / 60_000)
  const seconds = Math.floor((remainingMs % 60_000) / 1_000)

  return `Próxima atualização em ${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function Feed() {
  const { setLastUpdatedLabel } = useOutletContext<DashboardOutletContext>()
  const [filters, setFilters] = useState<FeedFilters>({})
  const [referenceTime, setReferenceTime] = useState(() => Date.now())
  const { events, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading, dataUpdatedAt } =
    useFeed(filters)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setReferenceTime(Date.now())
    }, 1_000)

    return () => window.clearInterval(interval)
  }, [])

  const countdownLabel = formatCountdown(dataUpdatedAt, referenceTime)

  useEffect(() => {
    setLastUpdatedLabel(countdownLabel)
  }, [countdownLabel, setLastUpdatedLabel])

  const summary = `${events.length.toString().padStart(2, '0')} eventos carregados`

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">feed de tensões</p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Eventos geopolíticos com impacto direto para investidores brasileiros.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Filtre por categoria, acompanhe a atualização automática e percorra o histórico recente em um painel
                contínuo.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <RefetchIndicator isFetching={isFetching} dataUpdatedAt={dataUpdatedAt} />
            <div className="text-right font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              <div>{summary}</div>
              <div>{countdownLabel}</div>
            </div>
          </div>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <EventList
        events={events}
        isLoading={isLoading}
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </section>
  )
}
