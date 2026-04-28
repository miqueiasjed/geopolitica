import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { useAddonAccess } from '../../hooks/useAddonAccess'
import { AddonGate } from '../../components/AddonGate'
import { useWarFeed } from '../../hooks/useWarFeed'
import { EventCard } from '../../components/EventCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import api from '../../lib/axios'
import { formatDistanceToNow } from '../../utils/relativeTime'
import type { ConteudoCard } from '../../types/biblioteca'

interface ConteudosResponse {
  data: ConteudoCard[]
}

async function fetchWarBriefings(): Promise<ConteudoCard[]> {
  const response = await api.get<ConteudosResponse>('/conteudos', {
    params: { vertical: 'war', publicado: true, limit: 10 },
  })
  return response.data.data
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#1e1e20] bg-[#111113] p-5">
      <div className="mb-3 h-5 w-24 rounded-full bg-zinc-800" />
      <div className="mb-3 h-5 w-3/4 rounded bg-zinc-800" />
      <div className="space-y-2 mt-2">
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-5/6 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

function BriefingCard({ conteudo }: { conteudo: ConteudoCard }) {
  return (
    <div className="rounded-2xl border border-[#1e1e20] bg-[#111113] p-5 transition-colors hover:border-[#C9B882]/30">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {formatDistanceToNow(conteudo.publicado_em)}
      </p>
      <h3 className="line-clamp-2 text-base font-medium text-white">{conteudo.titulo}</h3>
      {conteudo.resumo ? (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{conteudo.resumo}</p>
      ) : null}
    </div>
  )
}

export function MonitorGuerra() {
  const temAcesso = useAddonAccess('war')
  const prefersReducedMotion = useReducedMotion()
  const sentinelaRef = useRef<HTMLDivElement | null>(null)

  const {
    events,
    isLoading: isFeedLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useWarFeed()

  const {
    data: briefings,
    isLoading: isBriefingsLoading,
  } = useQuery({
    queryKey: ['war-briefings'],
    queryFn: fetchWarBriefings,
    staleTime: 10 * 60 * 1000,
    enabled: temAcesso,
  })

  useEffect(() => {
    const sentinela = sentinelaRef.current
    if (!sentinela) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinela)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (!temAcesso) {
    return <AddonGate addonKey="war" />
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      className="space-y-10"
    >
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#C9B882]/70">VERTICAIS</p>
        <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">Monitor de Guerra</h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
          Conflitos e tensões militares com impacto em mercados
        </p>
      </div>

      <section className="space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          FEED DE TENSÕES MILITARES
        </p>

        {isFeedLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            Nenhum evento militar registrado no momento.
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}

            <div ref={sentinelaRef} aria-hidden="true" className="h-6 w-full" />

            {isFetchingNextPage ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="md" />
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          BRIEFINGS DE GUERRA
        </p>

        {isBriefingsLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !briefings || briefings.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            Nenhum briefing de guerra disponível no momento.
          </p>
        ) : (
          <div className="space-y-4">
            {briefings.map((conteudo) => (
              <BriefingCard key={conteudo.id} conteudo={conteudo} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}
