import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAlertas } from '../../hooks/useAlertas'
import { useMarcarAlertaLido } from '../../hooks/useMarcarAlertaLido'
import type { Alerta, NivelAlerta } from '../../types/alertas'

interface AlertaPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface NivelConfig {
  classes: string
  label: string
}

const nivelConfig: Record<NivelAlerta, NivelConfig> = {
  critical: {
    classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40',
    label: 'Crítico',
  },
  high: {
    classes: 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40',
    label: 'Alto',
  },
  medium: {
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40',
    label: 'Médio',
  },
}

function formatarData(iso: string): string {
  const d = new Date(iso)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

interface AlertaItemProps {
  alerta: Alerta
  prefersReduced: boolean | null
}

function AlertaItem({ alerta, prefersReduced }: AlertaItemProps) {
  const { marcarLido, isPending } = useMarcarAlertaLido()
  const config = nivelConfig[alerta.nivel]
  const analiseResumida =
    alerta.analise.length > 100 ? `${alerta.analise.slice(0, 100)}...` : alerta.analise

  return (
    <motion.div
      layout
      exit={prefersReduced ? {} : { opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${config.classes}`}
        >
          {config.label}
        </span>
        <span className="font-mono text-[11px] text-zinc-500">
          {alerta.regiao} · {formatarData(alerta.created_at)}
        </span>
      </div>

      <p className="mb-1 text-sm font-semibold text-zinc-100">{alerta.titulo}</p>
      <p className="mb-3 text-xs leading-relaxed text-zinc-400">{analiseResumida}</p>

      <button
        type="button"
        onClick={() => marcarLido(alerta.id)}
        disabled={isPending}
        className="inline-flex items-center rounded-full border border-zinc-700 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Aguarde...' : 'Marcar como lido'}
      </button>
    </motion.div>
  )
}

export function AlertaPanel({ isOpen, onClose }: AlertaPanelProps) {
  const prefersReduced = useReducedMotion()
  const { alertas, isLoading } = useAlertas()

  const panelInitial = prefersReduced ? false : { x: '100%' }
  const panelAnimate = { x: 0 }
  const panelExit = prefersReduced ? {} : { x: '100%' }
  const panelTransition = { duration: prefersReduced ? 0 : 0.4, ease: 'easeOut' as const }

  const overlayInitial = prefersReduced ? false : { opacity: 0 }
  const overlayAnimate = { opacity: 1 }
  const overlayExit = prefersReduced ? {} : { opacity: 0 }
  const overlayTransition = { duration: prefersReduced ? 0 : 0.2 }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="alerta-panel-overlay"
            className="fixed inset-0 z-40 bg-black/50"
            initial={overlayInitial}
            animate={overlayAnimate}
            exit={overlayExit}
            transition={overlayTransition}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Painel lateral */}
          <motion.aside
            key="alerta-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Painel de alertas"
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-zinc-950 border-l border-zinc-800 sm:w-80 md:w-96"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-100">
                Alertas
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar painel de alertas"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF3C]/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-800" />
                  ))}
                </div>
              ) : alertas.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Nenhum alerta pendente 🎉
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {alertas.map((alerta) => (
                      <AlertaItem
                        key={alerta.id}
                        alerta={alerta}
                        prefersReduced={prefersReduced}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
