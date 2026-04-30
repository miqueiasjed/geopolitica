import { motion, useReducedMotion } from 'framer-motion'
import type { CriseHistorica } from '../../types/timeline'

interface CriseMarkerProps {
  crise: CriseHistorica
  onClick: (slug: string) => void
  posicaoX: number
  larguraPorAno: number
  anoAtual: number
}

export function CriseMarker({ crise, onClick, posicaoX, larguraPorAno, anoAtual }: CriseMarkerProps) {
  const prefersReducedMotion = useReducedMotion()

  const anoFim = crise.data_fim ? new Date(crise.data_fim).getFullYear() : anoAtual
  const duracao = Math.max(1, anoFim - crise.ano + 1)
  const larguraBarra = duracao * larguraPorAno

  return (
    <motion.g
      onClick={() => onClick(crise.slug)}
      style={{ cursor: 'pointer' }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.3 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      <title>{crise.titulo} ({crise.ano})</title>

      {/* Barra de duração */}
      <rect
        x={posicaoX}
        y={70}
        width={larguraBarra}
        height={30}
        fill="#BFFF3C"
        fillOpacity={0.4}
        rx={3}
      />

      {/* Linha vertical */}
      <line
        x1={posicaoX}
        y1={40}
        x2={posicaoX}
        y2={100}
        stroke="#BFFF3C"
        strokeWidth={1.5}
      />

      {/* Círculo clicável */}
      <circle
        cx={posicaoX}
        cy={40}
        r={6}
        fill="#BFFF3C"
        fillOpacity={1}
      />
    </motion.g>
  )
}
