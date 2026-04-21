import { ArrowRightIcon, Cross2Icon, GlobeIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEventosPais } from '../hooks/useEventosPais'
import { usePerfilPais } from '../hooks/usePerfilPais'
import { formatDistanceToNow } from '../utils/relativeTime'
import type { EventoPais } from '../types/pais'

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

function corNivelTensao(nivel: string): string {
  switch (nivel.toUpperCase()) {
    case 'CRÍTICO':
    case 'CRITICO':
      return 'border-red-500/30 bg-red-500/10 text-red-400'
    case 'ALTO':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-400'
    case 'MÉDIO':
    case 'MEDIO':
      return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
    case 'MONITORAR':
      return 'border-green-500/30 bg-green-500/10 text-green-400'
    default:
      return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
  }
}

function EventoItem({ event }: { event: EventoPais }) {
  const publishedAt = event.created_at ? formatDistanceToNow(event.created_at) : 'sem data'
  const nivelTensao = event.impact_label ?? 'MONITORAR'

  return (
    <motion.article
      variants={itemVariants}
      className="rounded-xl border border-[#1e1e20] bg-[#111113] p-4 transition-colors hover:border-[#C9B882]/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-start gap-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${corNivelTensao(nivelTensao)}`}>
              {nivelTensao}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{publishedAt}</span>
          </div>

          <p className="line-clamp-2 text-sm font-medium text-white">{event.titulo}</p>

          {event.descricao && (
            <p className="line-clamp-3 text-xs leading-5 text-zinc-400">
              {event.descricao}
            </p>
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

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[#1e1e20] ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

function TextoPendente({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: linhas }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className={index === linhas - 1 ? 'h-4 w-4/6' : 'h-4 w-full'}
        />
      ))}
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
        Analise sendo gerada...
      </p>
    </div>
  )
}

function PanelContent({ regiao, nome }: { regiao: string; nome: string | null }) {
  const prefersReduced = useReducedMotion()
  const { perfil, isLoading: isLoadingPerfil, error: perfilError } = usePerfilPais(regiao)
  const { eventos, isLoading, error } = useEventosPais(regiao)
  const indicadoresRelevantes = Array.isArray(perfil?.indicadores_relevantes)
    ? perfil.indicadores_relevantes
    : []

  return (
    <>
      <div className="flex items-start gap-3 pr-10">
        {isLoadingPerfil ? (
          <SkeletonBlock className="h-12 w-12 flex-shrink-0 rounded-xl" />
        ) : perfil?.bandeira_emoji ? (
          <span className="text-5xl leading-none" aria-hidden="true">
            {perfil.bandeira_emoji}
          </span>
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#1e1e20]">
            <GlobeIcon className="h-6 w-6 text-zinc-500" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-cyan-500/10 bg-cyan-500/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-100/75">
              {regiao}
            </span>
            {perfil?.regiao_geopolitica && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C9B882]/70">
                {perfil.regiao_geopolitica}
              </span>
            )}
          </div>

          <h2 className="truncate text-xl font-semibold text-white tracking-tight">
            {perfil?.nome_pt ?? nome ?? regiao}
          </h2>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-5 overflow-y-auto pr-1 -mr-1">
        {isLoadingPerfil ? (
          <LoadingSpinner />
        ) : perfilError ? (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
            className="rounded-xl border border-[#1e1e20] bg-[#111113] p-5 text-center"
          >
            <p className="text-sm text-zinc-500">Nao foi possivel carregar o perfil</p>
            <p className="mt-1 text-xs text-zinc-600">deste país no momento</p>
          </motion.div>
        ) : (
          <>
            <motion.section
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-[#1e1e20] bg-[#111113] p-4"
            >
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C9B882]/70">
                contexto geopolítico
              </p>
              {perfil?.contexto_geopolitico ? (
                <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                  {perfil.contexto_geopolitico}
                </p>
              ) : (
                <TextoPendente />
              )}
            </motion.section>

            <motion.section
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-[#1e1e20] bg-[#111113] p-4"
            >
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C9B882]/70">
                liderança atual
              </p>
              {perfil?.analise_lideranca ? (
                <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                  {perfil.analise_lideranca}
                </p>
              ) : (
                <TextoPendente linhas={2} />
              )}
            </motion.section>

            {indicadoresRelevantes.length > 0 && (
              <motion.section
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="rounded-xl border border-[#1e1e20] bg-[#111113] p-4"
              >
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C9B882]/70">
                  indicadores relevantes
                </p>
                <div className="flex flex-wrap gap-2">
                  {indicadoresRelevantes.map((indicador) => (
                    <span
                      key={indicador}
                      className="inline-flex items-center rounded-full border border-[#C9B882]/20 bg-[#C9B882]/8 px-2.5 py-1 font-mono text-[10px] text-[#C9B882]"
                    >
                      {indicador}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            <Link
              to={`/paises/${regiao}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#C9B882]/20 bg-[#C9B882]/8 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C9B882] transition-colors hover:border-[#C9B882]/40 hover:bg-[#C9B882]/15"
            >
              Perfil completo
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </>
        )}

        <div className="pt-1">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Eventos recentes
          </p>

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <p className="text-sm text-zinc-500">Nao foi possivel carregar eventos</p>
              <p className="mt-1 text-xs text-zinc-600">para este país no momento</p>
            </motion.div>
          ) : eventos.length === 0 ? (
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center py-10 text-center"
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
            className="absolute inset-0 z-20 bg-black/20"
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
            className="absolute right-0 top-0 z-30 flex h-full w-full max-w-[420px] flex-col border-l border-[#1e1e20] bg-[#0d0d0f] px-6 py-6 shadow-2xl"
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
