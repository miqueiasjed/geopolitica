import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { EventoTimeline } from '../../types/timeline'

interface EventoDetailPanelProps {
  eventoId: number | null
  eventos: EventoTimeline[]
  onClose: () => void
}

export function EventoDetailPanel({ eventoId, eventos, onClose }: EventoDetailPanelProps) {
  const prefersReduced = useReducedMotion()
  const evento = eventos.find((e) => e.id === eventoId)

  return (
    <AnimatePresence>
      {eventoId !== null && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/50 z-40"
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            onClick={onClose}
          />

          {/* Painel */}
          <motion.div
            key="painel"
            initial={prefersReduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', damping: 25, stiffness: 200 }
            }
            className="fixed right-0 top-0 h-full w-[380px] bg-[#1C1F26] overflow-y-auto z-50 border-l border-[#2D3240]"
          >
            <div className="p-6">
              {/* Botão fechar */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar painel"
                  className="text-[#6B7280] hover:text-[#E8E4DC] transition-colors text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              {evento ? (
                <>
                  {/* Header */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#E8E4DC] mb-2">{evento.titulo}</h2>

                    {/* Badge nível de tensão */}
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-[#2D3240] text-[#C9B882] mb-2">
                      {evento.nivel_tensao}
                    </span>

                    {/* Data */}
                    <p className="text-[#6B7280] text-sm">
                      {new Date(evento.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <hr className="border-[#2D3240] my-4" />

                  {/* Link para Feed */}
                  <div className="mt-4">
                    <Link
                      to="/dashboard/feed"
                      className="inline-flex items-center gap-1 text-sm text-[#C9B882] hover:text-[#E8E4DC] transition-colors"
                    >
                      Ver no Feed →
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="h-7 w-3/4 bg-[#2D3240] rounded animate-pulse" />
                  <div className="h-4 w-1/4 bg-[#2D3240] rounded animate-pulse" />
                  <div className="h-4 w-full bg-[#2D3240] rounded animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
