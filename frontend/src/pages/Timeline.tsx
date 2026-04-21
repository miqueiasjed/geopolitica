import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTimeline } from '../hooks/useTimeline'
import { TimelineBar } from '../components/timeline/TimelineBar'
import { CriseDetailPanel } from '../components/timeline/CriseDetailPanel'
import { EventoDetailPanel } from '../components/timeline/EventoDetailPanel'
import type { CategoriaCrise, FiltrosTimeline } from '../types/timeline'

export function Timeline() {
  const prefersReduced = useReducedMotion()
  const [slugSelecionado, setSlugSelecionado] = useState<string | null>(null)
  const [eventoIdSelecionado, setEventoIdSelecionado] = useState<number | null>(null)
  const [filtros, setFiltros] = useState<FiltrosTimeline>({})
  const { crises, eventos, isLoading } = useTimeline(filtros)

  const handleCriseClick = (slug: string) => {
    setEventoIdSelecionado(null)
    setSlugSelecionado(slug)
  }

  const handleEventoClick = (id: number) => {
    setSlugSelecionado(null)
    setEventoIdSelecionado(id)
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Título */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">linha do tempo</p>
        <h1 className="text-2xl font-bold text-[#E8E4DC] sm:text-3xl">Linha do Tempo de Crises</h1>
        <p className="text-[#6B7280] text-sm mt-1">Crises geopolíticas históricas e eventos ativos</p>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4">
        <span className="flex items-center gap-2 text-sm text-[#C9B882]">
          <span className="w-3 h-3 rounded-sm bg-[#C9B882]" /> Crises Históricas
        </span>
        <span className="flex items-center gap-2 text-sm text-[#E8E4DC]">
          <span className="w-3 h-3 rounded-sm bg-[#E8E4DC]" /> Eventos Ativos
        </span>
      </div>

      {/* Filtros */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-3">
        <select
          className="bg-[#1C1F26] border border-[#2D3240] text-[#E8E4DC] rounded px-3 py-1.5 text-sm"
          value={filtros.categoria ?? ''}
          onChange={(e) =>
            setFiltros((f) => ({
              ...f,
              categoria: (e.target.value as CategoriaCrise) || undefined,
            }))
          }
        >
          <option value="">Todas as categorias</option>
          <option value="guerra">Guerra</option>
          <option value="econômica">Econômica</option>
          <option value="humanitária">Humanitária</option>
          <option value="geopolítica">Geopolítica</option>
          <option value="terrorismo">Terrorismo</option>
          <option value="financeira">Financeira</option>
          <option value="energética">Energética</option>
          <option value="naval">Naval</option>
          <option value="logística">Logística</option>
          <option value="transição">Transição</option>
          <option value="petróleo">Petróleo</option>
        </select>
        <input
          type="number"
          placeholder="Ano início"
          className="bg-[#1C1F26] border border-[#2D3240] text-[#E8E4DC] rounded px-3 py-1.5 text-sm w-28"
          value={filtros.periodo_inicio ?? ''}
          onChange={(e) =>
            setFiltros((f) => ({
              ...f,
              periodo_inicio: e.target.value ? parseInt(e.target.value) : undefined,
            }))
          }
        />
        <input
          type="number"
          placeholder="Ano fim"
          className="bg-[#1C1F26] border border-[#2D3240] text-[#E8E4DC] rounded px-3 py-1.5 text-sm w-28"
          value={filtros.periodo_fim ?? ''}
          onChange={(e) =>
            setFiltros((f) => ({
              ...f,
              periodo_fim: e.target.value ? parseInt(e.target.value) : undefined,
            }))
          }
        />
      </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="h-[220px] bg-[#1C1F26] rounded-lg animate-pulse" />
      ) : (
        <TimelineBar
          crises={crises}
          eventos={eventos}
          onCriseClick={handleCriseClick}
          onEventoClick={handleEventoClick}
        />
      )}

      {/* Painéis de detalhe */}
      <CriseDetailPanel slug={slugSelecionado} onClose={() => setSlugSelecionado(null)} />
      <EventoDetailPanel
        eventoId={eventoIdSelecionado}
        eventos={eventos}
        onClose={() => setEventoIdSelecionado(null)}
      />
    </motion.div>
  )
}
