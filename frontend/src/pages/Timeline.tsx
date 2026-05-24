import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTimeline } from '../hooks/useTimeline'
import { TimelineBar } from '../components/timeline/TimelineBar'
import { CriseDetailPanel } from '../components/timeline/CriseDetailPanel'
import { EventoDetailPanel } from '../components/timeline/EventoDetailPanel'
import { CATEGORY_COLORS } from '../components/timeline/CriseMarker'
import { PlanoGate } from '../components/PlanoGate'
import type { CategoriaCrise, CriseHistorica, EventoTimeline, FiltrosTimeline } from '../types/timeline'

interface TimelineVerticalMobileProps {
  crises: CriseHistorica[]
  eventos: EventoTimeline[]
  onCriseClick: (slug: string) => void
  onEventoClick: (id: number) => void
}

function getCategoryColor(categoria: CategoriaCrise): string {
  return CATEGORY_COLORS[categoria] ?? '#6B7280'
}

function getImpactColor(impactScore: number): string {
  if (impactScore >= 7) return '#EF4444'
  if (impactScore >= 4) return '#FACC15'
  return '#4ade80'
}

function TimelineVerticalMobile({
  crises,
  eventos,
  onCriseClick,
  onEventoClick,
}: TimelineVerticalMobileProps) {
  // Ordenar crises por ano desc, depois eventos por data desc
  const crisesSorted = [...crises].sort((a, b) => b.ano - a.ano)
  const eventosSorted = [...eventos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="space-y-6">
      {/* Crises */}
      {crisesSorted.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#BFFF3C] mb-3">
            Crises Históricas
          </p>
          <ul className="border-l-2 border-[#2D3240] pl-4 space-y-4">
            {crisesSorted.map((crise) => {
              const corCategoria = crise.categorias[0]
                ? getCategoryColor(crise.categorias[0])
                : '#6B7280'
              return (
                <li key={crise.id} className="relative">
                  {/* Marcador na linha */}
                  <span
                    className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-sm border border-[#1C1F26]"
                    style={{ background: corCategoria }}
                  />
                  <button
                    type="button"
                    onClick={() => onCriseClick(crise.slug)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-[#F7F7F2] leading-snug">
                        {crise.titulo}
                      </span>
                      <span className="font-mono text-xs text-[#BFFF3C] shrink-0">{crise.ano}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {crise.categorias.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="rounded px-1.5 py-0.5 font-mono text-[10px] capitalize"
                          style={{
                            color: getCategoryColor(cat),
                            background: `${getCategoryColor(cat)}1A`,
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                      {crise.data_fim === null && (
                        <span className="rounded px-1.5 py-0.5 font-mono text-[10px] text-[#BFFF3C] bg-[#BFFF3C]/10">
                          em andamento
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Eventos */}
      {eventosSorted.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-3">
            Eventos Ativos
          </p>
          <ul className="border-l-2 border-[#2D3240] pl-4 space-y-4">
            {eventosSorted.map((evento) => {
              const cor = getImpactColor(evento.impact_score)
              const ano = new Date(evento.created_at).getFullYear()
              return (
                <li key={evento.id} className="relative">
                  <span
                    className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-[#1C1F26]"
                    style={{ background: cor }}
                  />
                  <button
                    type="button"
                    onClick={() => onEventoClick(evento.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-[#F7F7F2] leading-snug">
                        {evento.titulo}
                      </span>
                      <span className="font-mono text-xs text-zinc-500 shrink-0">{ano}</span>
                    </div>
                    <span
                      className="inline-block mt-1 rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{ color: cor, background: `${cor}1A` }}
                    >
                      {evento.impact_label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {crisesSorted.length === 0 && eventosSorted.length === 0 && (
        <p className="text-center text-sm text-zinc-500 py-8">
          Nenhum resultado para os filtros selecionados.
        </p>
      )}
    </div>
  )
}

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
    <PlanoGate>
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Título */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#BFFF3C]/70">linha do tempo</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Linha do Tempo de Crises</h1>
        <p className="text-[#6B7280] text-sm mt-1">Crises geopolíticas históricas e eventos ativos</p>
      </div>

      {/* Legenda */}
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Categorias de crise</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(Object.entries(CATEGORY_COLORS) as [CategoriaCrise, string][]).map(([cat, cor]) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-zinc-400 capitalize">
              <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: cor }} />
              {cat}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: '#4ade80' }} />
            Evento baixo impacto
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: '#FACC15' }} />
            Evento médio impacto
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: '#EF4444' }} />
            Evento alto impacto
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-3">
        <select
          className="bg-[#1C1F26] border border-[#2D3240] text-[#F7F7F2] rounded px-3 py-1.5 text-sm"
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
          className="bg-[#1C1F26] border border-[#2D3240] text-[#F7F7F2] rounded px-3 py-1.5 text-sm w-28"
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
          className="bg-[#1C1F26] border border-[#2D3240] text-[#F7F7F2] rounded px-3 py-1.5 text-sm w-28"
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

      {/* Timeline — desktop: SVG horizontal com scroll */}
      <div className="hidden sm:block">
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
      </div>

      {/* Timeline — mobile: lista vertical */}
      <div className="block sm:hidden">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#1C1F26] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <TimelineVerticalMobile
            crises={crises}
            eventos={eventos}
            onCriseClick={handleCriseClick}
            onEventoClick={handleEventoClick}
          />
        )}
      </div>

      {/* Painéis de detalhe */}
      <CriseDetailPanel slug={slugSelecionado} onClose={() => setSlugSelecionado(null)} />
      <EventoDetailPanel
        eventoId={eventoIdSelecionado}
        eventos={eventos}
        onClose={() => setEventoIdSelecionado(null)}
      />
    </motion.div>
    </PlanoGate>
  )
}
