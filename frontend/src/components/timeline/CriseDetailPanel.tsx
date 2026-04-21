import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCriseDetalhe } from '../../hooks/useCriseDetalhe'

interface CriseDetailPanelProps {
  slug: string | null
  onClose: () => void
}

export function CriseDetailPanel({ slug, onClose }: CriseDetailPanelProps) {
  const prefersReduced = useReducedMotion()
  const { crise, isLoading } = useCriseDetalhe(slug)

  return (
    <AnimatePresence>
      {slug && (
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
            className="fixed right-0 top-0 h-full w-full overflow-y-auto bg-[#1C1F26] z-50 border-l border-[#2D3240] sm:w-[480px]"
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

              {isLoading ? (
                /* Skeleton loading */
                <div className="space-y-4">
                  <div className="h-7 w-3/4 bg-[#2D3240] rounded animate-pulse" />
                  <div className="h-4 w-1/4 bg-[#2D3240] rounded animate-pulse" />
                  <div className="h-4 w-full bg-[#2D3240] rounded animate-pulse" />
                </div>
              ) : crise ? (
                <>
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h2 className="text-xl font-bold text-[#E8E4DC]">{crise.titulo}</h2>
                      <span className="text-[#C9B882] font-mono text-base">{crise.ano}</span>
                    </div>

                    {/* Badges categorias */}
                    <div className="flex flex-wrap gap-2">
                      {crise.categorias.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded text-xs bg-[#2D3240] text-[#C9B882]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Seção 1: Contexto Geopolítico */}
                  <hr className="border-[#2D3240] my-4" />
                  <section>
                    <h3 className="text-[#C9B882] text-sm uppercase tracking-wider mb-2">
                      Contexto Geopolítico
                    </h3>
                    <p className="text-[#E8E4DC] text-sm leading-relaxed">
                      {crise.contexto_geopolitico}
                    </p>
                  </section>

                  {/* Seção 2: Impacto Global */}
                  <hr className="border-[#2D3240] my-4" />
                  <section>
                    <h3 className="text-[#C9B882] text-sm uppercase tracking-wider mb-2">
                      Impacto Global
                    </h3>
                    <p className="text-[#E8E4DC] text-sm leading-relaxed mb-3">
                      {crise.impacto_global}
                    </p>
                    {crise.metricas_globais.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {crise.metricas_globais.map((m) => (
                          <div key={m.label} className="bg-[#0F1117] rounded p-3">
                            <div className="text-xs text-[#6B7280]">{m.label}</div>
                            <div className="text-lg font-bold text-[#E8E4DC]">{m.valor}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Seção 3: Impacto no Brasil */}
                  <hr className="border-[#2D3240] my-4" />
                  <section>
                    <h3 className="text-[#C9B882] text-sm uppercase tracking-wider mb-2">
                      Impacto no Brasil
                    </h3>
                    <p className="text-[#E8E4DC] text-sm leading-relaxed mb-3">
                      {crise.impacto_brasil}
                    </p>
                    {crise.metricas_brasil.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {crise.metricas_brasil.map((m) => (
                          <div key={m.label} className="bg-[#0F1117] rounded p-3">
                            <div className="text-xs text-[#6B7280]">{m.label}</div>
                            <div className="text-lg font-bold text-[#E8E4DC]">{m.valor}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Link para Biblioteca */}
                  {crise.content_slug && (
                    <div className="mt-6">
                      <Link
                        to={`/dashboard/biblioteca/${crise.content_slug}`}
                        className="inline-flex items-center gap-1 text-sm text-[#C9B882] hover:text-[#E8E4DC] transition-colors"
                      >
                        Ver na Biblioteca →
                      </Link>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
