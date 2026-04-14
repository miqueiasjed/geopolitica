import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useIndicadores } from '../../hooks/useIndicadores'
import { useIndicadorHistorico } from '../../hooks/useIndicadorHistorico'
import { IndicatorCard } from './IndicatorCard'
import type { Indicador } from '../../types/indicadores'

function formatarTimestamp(ultimaAtualizacao: string | null): string {
  if (!ultimaAtualizacao) return ''

  const agora = new Date()
  const atualizado = new Date(ultimaAtualizacao)
  const diffMs = agora.getTime() - atualizado.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'agora mesmo'
  if (diffMin < 60) return `${diffMin} min atrás`
  const diffH = Math.floor(diffMin / 60)
  return `há ${diffH} h`
}

interface IndicatorCardWithHistoricoProps {
  indicador: Indicador
}

function IndicatorCardWithHistorico({ indicador }: IndicatorCardWithHistoricoProps) {
  const { historico } = useIndicadorHistorico(indicador.simbolo)
  return <IndicatorCard indicador={indicador} historico={historico} />
}

const skeletonVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const skeletonItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
}

function SkeletonCards({ prefersReduced }: { prefersReduced: boolean | null }) {
  return (
    <motion.div
      className="flex gap-4 px-4"
      variants={prefersReduced ? undefined : skeletonVariants}
      initial={prefersReduced ? false : 'hidden'}
      animate={prefersReduced ? undefined : 'visible'}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          variants={prefersReduced ? undefined : skeletonItemVariants}
          className="min-w-[140px] h-[72px] rounded-lg bg-zinc-800 animate-pulse"
        />
      ))}
    </motion.div>
  )
}

const cardsVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
}

export function IndicatorsBar() {
  const prefersReduced = useReducedMotion()
  const { indicadores, isLoading, ultimaAtualizacao } = useIndicadores()
  const timestamp = formatarTimestamp(ultimaAtualizacao)

  return (
    <div
      className="h-16 bg-[#0d0d0f] border-b border-zinc-800 flex items-center justify-between overflow-hidden"
      role="region"
      aria-label="Indicadores de mercado"
    >
      {/* Label esquerdo */}
      <span className="text-xs text-zinc-500 px-4 shrink-0">Mercados</span>

      {/* Cards com scroll horizontal */}
      <div className="flex-1 overflow-x-auto scrollbar-hide min-w-0">
        {isLoading ? (
          <SkeletonCards prefersReduced={prefersReduced} />
        ) : (
          <motion.div
            className="flex gap-4 px-4 py-2"
            variants={prefersReduced ? undefined : cardsVariants}
            initial={prefersReduced ? false : 'hidden'}
            animate={prefersReduced ? undefined : 'visible'}
          >
            {indicadores.slice(0, 6).map((indicador) => (
              <motion.div
                key={indicador.simbolo}
                variants={prefersReduced ? undefined : cardItemVariants}
              >
                <IndicatorCardWithHistorico indicador={indicador} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Timestamp direito */}
      {timestamp && (
        <span className="text-xs text-zinc-600 px-4 shrink-0 whitespace-nowrap">
          atualizado {timestamp}
        </span>
      )}
    </div>
  )
}
