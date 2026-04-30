import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useIndicadores } from '../../hooks/useIndicadores'
import { useIndicadorHistorico } from '../../hooks/useIndicadorHistorico'
import { IndicatorCard } from './IndicatorCard'
import type { Indicador } from '../../types/indicadores'

const SIMBOLOS_COM_HISTORICO = new Set(['BZ=F', 'USDBRL=X', 'NG=F', 'ZS=F', 'ZW=F', 'TIO=F'])

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
  const simbolo = typeof indicador.simbolo === 'string' ? indicador.simbolo : ''
  const { historico } = useIndicadorHistorico(simbolo, SIMBOLOS_COM_HISTORICO.has(simbolo))
  return <IndicatorCard indicador={indicador} historico={historico} />
}

function getIndicadorKey(indicador: Indicador, index: number): string {
  const id = indicador.id ?? 'sem-id'
  const simbolo = indicador.simbolo ?? 'sem-simbolo'
  const nome = indicador.nome ?? 'sem-nome'

  return `indicador-${id}-${simbolo}-${nome}-${index}`
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
      className="flex h-12 items-center"
      variants={prefersReduced ? undefined : skeletonVariants}
      initial={prefersReduced ? false : 'hidden'}
      animate={prefersReduced ? undefined : 'visible'}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          variants={prefersReduced ? undefined : skeletonItemVariants}
          className="mx-3 h-7 min-w-[132px] rounded bg-white/[0.06] animate-pulse"
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
    <section
      className="border-b border-[#BFFF3C]/10 bg-[#070808]/82 backdrop-blur-xl"
      role="region"
      aria-label="Indicadores de mercado"
    >
      <div className="mx-auto flex max-w-[1500px] items-center px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 shrink-0 items-center gap-3 border-r border-white/8 pr-4">
          <p className="font-mono text-[11px] uppercase leading-none tracking-[0.2em] text-[#BFFF3C]/80">
            Mercados
          </p>
          {timestamp && (
            <p className="hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600 sm:block">
              {timestamp}
            </p>
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#070808] to-transparent" />
          <div className="overflow-x-auto scrollbar-hide">
            {isLoading ? (
              <SkeletonCards prefersReduced={prefersReduced} />
            ) : (
              <motion.div
                className="flex h-12 pr-10"
                variants={prefersReduced ? undefined : cardsVariants}
                initial={prefersReduced ? false : 'hidden'}
                animate={prefersReduced ? undefined : 'visible'}
              >
                {indicadores.slice(0, 6).map((indicador, index) => (
                  <motion.div
                    key={getIndicadorKey(indicador, index)}
                    className="shrink-0"
                    variants={prefersReduced ? undefined : cardItemVariants}
                  >
                    <IndicatorCardWithHistorico indicador={indicador} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
