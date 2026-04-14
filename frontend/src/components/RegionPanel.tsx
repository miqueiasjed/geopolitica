import { Cross2Icon, GlobeIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ImpactBadge } from './ImpactBadge'
import { useRegiaoEventos } from '../hooks/useRegiaoEventos'
import { formatDistanceToNow } from '../utils/relativeTime'
import type { Event } from '../types/feed'

interface RegionPanelProps {
  regiao: string | null
  nome: string | null
  onClose: () => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

function EventoItem({ event }: { event: Event }) {
  const publishedAt = event.publicado_em ? formatDistanceToNow(event.publicado_em) : 'sem data'

  return (
    <motion.article
      variants={itemVariants}
      className="rounded-xl border border-[#1e1e20] bg-[#111113] p-4 transition-colors hover:border-[#C9B882]/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-start gap-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ImpactBadge label={event.impact_label} score={event.impact_score} />
            <span className="rounded-full border border-white/6 bg-white/3 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {event.fonte}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{publishedAt}</span>
          </div>

          {event.fonte_url ? (
            <a
              href={event.fonte_url}
              target="_blank"
              rel="noreferrer"
              className="line-clamp-2 text-sm font-medium text-white transition-colors hover:text-[#C9B882]"
            >
              {event.titulo}
            </a>
          ) : (
            <p className="line-clamp-2 text-sm font-medium text-white">{event.titulo}</p>
          )}

          <p className="line-clamp-2 text-xs leading-5 text-zinc-400">
            {event.resumo}
          </p>

          {event.categorias.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {event.categorias.map((categoria) => (
                <span
                  key={categoria}
                  className="rounded-full border border-[#C9B882]/20 bg-[#C9B882]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C9B882]"
                >
                  {categoria}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9B882]/20 border-t-[#C9B882]"
        role="status"
        aria-label="Carregando eventos"
      />
    </div>
  )
}

function PanelContent({ regiao, nome }: { regiao: string; nome: string | null }) {
  const prefersReduced = useReducedMotion()
  const { eventos, isLoading } = useRegiaoEventos(regiao)

  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        <div className="flex items-center gap-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-100/75">
          <GlobeIcon />
          <span className="font-mono uppercase tracking-[0.16em]">{regiao}</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white tracking-tight">
        {nome ?? regiao}
      </h2>

      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
        Eventos geopolíticos recentes
      </p>

      <div className="mt-6 flex-1 overflow-y-auto pr-1 -mr-1">
        {isLoading ? (
          <LoadingSpinner />
        ) : eventos.length === 0 ? (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p className="text-sm text-zinc-500">Nenhum evento registrado</p>
            <p className="mt-1 text-xs text-zinc-600">para esta região no momento</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {eventos.map((event) => (
              <EventoItem key={event.id} event={event} />
            ))}
          </motion.div>
        )}
      </div>
    </>
  )
}

export function RegionPanel({ regiao, nome, onClose }: RegionPanelProps) {
  const prefersReduced = useReducedMotion()

  const slideProps = prefersReduced
    ? { initial: false, animate: { x: 0, opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { x: 420 },
        animate: { x: 0 },
        exit: { x: 420 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      }

  return (
    <AnimatePresence>
      {regiao !== null && (
        <>
          {/* Overlay semitransparente — fechar ao clicar fora */}
          <motion.div
            key="region-overlay"
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Painel lateral */}
          <motion.aside
            key="region-panel"
            className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col border-l border-[#1e1e20] bg-[#0d0d0f] px-6 py-6 shadow-2xl"
            {...slideProps}
            role="complementary"
            aria-label={`Eventos de ${nome ?? regiao}`}
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/8 text-zinc-400 transition-colors hover:border-[#C9B882]/30 hover:text-[#C9B882]"
            >
              <Cross2Icon />
            </button>

            <PanelContent regiao={regiao} nome={nome} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
