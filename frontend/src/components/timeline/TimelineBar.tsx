import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { CriseHistorica, EventoTimeline } from '../../types/timeline'
import { CriseMarker } from './CriseMarker'
import { EventoMarker } from './EventoMarker'

interface TimelineBarProps {
  crises: CriseHistorica[]
  eventos: EventoTimeline[]
  onCriseClick: (slug: string) => void
  onEventoClick: (id: number) => void
}

const ANO_INICIO = 1990
const SVG_WIDTH = 3000

function extrairAnoDoCreatedAt(createdAt: string): number {
  return new Date(createdAt).getFullYear()
}

export function TimelineBar({ crises, eventos, onCriseClick, onEventoClick }: TimelineBarProps) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const anoAtual = new Date().getFullYear()
  const totalAnos = anoAtual - ANO_INICIO + 1
  const larguraPorAno = SVG_WIDTH / totalAnos

  const posicaoX = (ano: number): number => (ano - ANO_INICIO) * larguraPorAno

  const scrollAnterior = () =>
    containerRef.current?.scrollBy({ left: -larguraPorAno * 10, behavior: 'smooth' })

  const scrollProximo = () =>
    containerRef.current?.scrollBy({ left: larguraPorAno * 10, behavior: 'smooth' })

  const anosEixo: number[] = []
  for (let ano = ANO_INICIO; ano <= anoAtual; ano += 2) {
    anosEixo.push(ano)
  }

  return (
    <div className="relative">
      {/* Botões de navegação */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={scrollAnterior}
          className="px-3 py-1 text-sm bg-[#2D3240] text-[#C9B882] rounded hover:bg-[#363C4E] transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={scrollProximo}
          className="px-3 py-1 text-sm bg-[#2D3240] text-[#C9B882] rounded hover:bg-[#363C4E] transition-colors"
        >
          Próximo →
        </button>
      </div>

      {/* SVG com scroll */}
      <div ref={containerRef} className="overflow-x-auto rounded-lg">
        <motion.svg
          width={SVG_WIDTH}
          height={220}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }}
        >
          {/* Faixa superior — sutil dourado */}
          <rect
            x={0}
            y={30}
            width={SVG_WIDTH}
            height={90}
            fill="rgba(201,184,130,0.05)"
          />

          {/* Faixa inferior — sutil branco */}
          <rect
            x={0}
            y={125}
            width={SVG_WIDTH}
            height={65}
            fill="rgba(232,228,220,0.05)"
          />

          {/* Label faixa superior */}
          <text
            x={8}
            y={25}
            fontSize={10}
            fill="#C9B882"
            letterSpacing={1}
            fontFamily="monospace"
          >
            CRISES HISTÓRICAS
          </text>

          {/* Label faixa inferior */}
          <text
            x={8}
            y={120}
            fontSize={10}
            fill="#E8E4DC"
            letterSpacing={1}
            fontFamily="monospace"
          >
            EVENTOS ATIVOS
          </text>

          {/* Eixo de anos */}
          {anosEixo.map((ano) => {
            const x = posicaoX(ano)
            return (
              <g key={ano}>
                <line
                  x1={x}
                  y1={20}
                  x2={x}
                  y2={200}
                  stroke="#2D3240"
                  strokeWidth={1}
                  strokeDasharray="3,4"
                />
                <text
                  x={x}
                  y={215}
                  textAnchor="middle"
                  fill="#6B7280"
                  fontSize={11}
                  fontFamily="monospace"
                >
                  {ano}
                </text>
              </g>
            )
          })}

          {/* Linha separadora */}
          <line
            x1={0}
            y1={122}
            x2={SVG_WIDTH}
            y2={122}
            stroke="#2D3240"
            strokeWidth={1}
          />

          {/* Linha do ano atual */}
          <line
            x1={posicaoX(anoAtual)}
            y1={20}
            x2={posicaoX(anoAtual)}
            y2={200}
            stroke="#C9B882"
            strokeWidth={1.5}
          />

          {/* Marcadores de crises */}
          {crises.map((crise) => (
            <CriseMarker
              key={crise.id}
              crise={crise}
              onClick={onCriseClick}
              posicaoX={posicaoX(crise.ano)}
              larguraPorAno={larguraPorAno}
              anoAtual={anoAtual}
            />
          ))}

          {/* Marcadores de eventos */}
          {eventos.map((evento) => {
            const ano = extrairAnoDoCreatedAt(evento.created_at)
            return (
              <EventoMarker
                key={evento.id}
                evento={evento}
                onClick={onEventoClick}
                posicaoX={posicaoX(ano)}
              />
            )
          })}
        </motion.svg>
      </div>
    </div>
  )
}
