import { GlobeIcon } from '@radix-ui/react-icons'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ImpactBadge } from './ImpactBadge'
import type { Event, ImpactLabel } from '../types/feed'
import { formatDistanceToNow } from '../utils/relativeTime'

interface EventCardProps {
  event: Event
}

const scoreStyles: Record<ImpactLabel, string> = {
  CRÍTICO: 'text-red-400',
  ALTO: 'text-orange-400',
  MÉDIO: 'text-yellow-400',
  MONITORAR: 'text-blue-400',
}

function formatPublishedAt(date: string | null) {
  if (!date) {
    return 'sem data'
  }

  return formatDistanceToNow(date)
}

export function EventCard({ event }: EventCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const navigate = useNavigate()
  const publishedAt = formatPublishedAt(event.publicado_em)

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
      onClick={() => navigate(`/dashboard/feed/${event.id}`)}
      className="cursor-pointer rounded-2xl border border-[#1e1e20] bg-[#111113] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:border-[#BFFF3C]/30 sm:p-5"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className={`min-w-14 font-mono text-3xl font-semibold ${scoreStyles[event.impact_label]}`}>
            {event.impact_score}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ImpactBadge label={event.impact_label} score={event.impact_score} />
              <span className="rounded-full border border-white/6 bg-white/3 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {event.fonte}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">{publishedAt}</span>
            </div>

            <h2 title={event.titulo} className="line-clamp-2 text-lg font-medium text-white">
              {event.titulo}
            </h2>
          </div>
        </div>

        {event.regiao ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-100/75">
            <GlobeIcon />
            <span className="font-mono uppercase tracking-[0.16em]">{event.regiao}</span>
          </div>
        ) : null}
      </header>

      <div className="mt-4 space-y-3">
        {event.analise_ia ? (
          <p title={event.analise_ia} className="line-clamp-3 text-sm leading-6 text-zinc-400">
            {event.analise_ia}
          </p>
        ) : (
          <p title={event.resumo} className="line-clamp-3 text-sm leading-6 text-zinc-500">
            {event.resumo}
          </p>
        )}
      </div>

      <footer className="mt-5 flex flex-wrap gap-2">
        {event.categorias.map((categoria) => (
          <span
            key={categoria}
            className="rounded-full border border-[#BFFF3C]/20 bg-[#BFFF3C]/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#BFFF3C]"
          >
            {categoria}
          </span>
        ))}
      </footer>
    </motion.article>
  )
}
