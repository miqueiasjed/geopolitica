import { motion, useReducedMotion } from 'framer-motion'
import type { EventoTimeline } from '../../types/timeline'

interface EventoMarkerProps {
  evento: EventoTimeline
  onClick: (id: number) => void
  posicaoX: number
}

function truncarTitulo(titulo: string, maxChars: number = 40): string {
  if (titulo.length <= maxChars) return titulo
  return titulo.slice(0, maxChars - 1) + '…'
}

function corImpacto(score: number): string {
  if (score >= 70) return '#EF4444'
  if (score >= 40) return '#FACC15'
  return '#4ade80'
}

export function EventoMarker({ evento, onClick, posicaoX }: EventoMarkerProps) {
  const prefersReducedMotion = useReducedMotion()
  const cor = corImpacto(evento.impact_score)

  const points = `${posicaoX},142 ${posicaoX + 8},150 ${posicaoX},158 ${posicaoX - 8},150`

  return (
    <motion.g
      onClick={() => onClick(evento.id)}
      style={{ cursor: 'pointer' }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.3 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      <title>{truncarTitulo(evento.titulo)}</title>

      <polygon
        points={points}
        fill={cor}
        fillOpacity={0.9}
        stroke={cor}
        strokeWidth={0.5}
      />
    </motion.g>
  )
}
