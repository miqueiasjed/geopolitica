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

export function EventoMarker({ evento, onClick, posicaoX }: EventoMarkerProps) {
  const prefersReducedMotion = useReducedMotion()

  const points = `${posicaoX},142 ${posicaoX + 8},150 ${posicaoX},158 ${posicaoX - 8},150`

  return (
    <motion.g
      onClick={() => onClick(evento.id)}
      style={{ cursor: 'pointer' }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.3 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      <title>{truncarTitulo(evento.titulo)}</title>

      {/* Losango */}
      <polygon
        points={points}
        fill="#F7F7F2"
      />
    </motion.g>
  )
}
