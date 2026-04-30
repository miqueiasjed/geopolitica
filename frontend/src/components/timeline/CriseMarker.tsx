import { motion, useReducedMotion } from 'framer-motion'
import type { CategoriaCrise, CriseHistorica } from '../../types/timeline'

interface CriseMarkerProps {
  crise: CriseHistorica
  onClick: (slug: string) => void
  posicaoX: number
  larguraPorAno: number
  anoAtual: number
  indice: number
}

export const CATEGORY_COLORS: Record<CategoriaCrise, string> = {
  guerra: '#EF4444',
  terrorismo: '#F43F5E',
  geopolítica: '#60A5FA',
  econômica: '#FACC15',
  financeira: '#F59E0B',
  energética: '#A855F7',
  humanitária: '#F97316',
  petróleo: '#D97706',
  naval: '#06B6D4',
  logística: '#14B8A6',
  transição: '#84CC16',
}

function corCategoria(categorias: CategoriaCrise[]): string {
  const primeira = categorias[0]
  return (primeira && CATEGORY_COLORS[primeira]) ?? '#BFFF3C'
}

export function CriseMarker({ crise, onClick, posicaoX, larguraPorAno, anoAtual, indice }: CriseMarkerProps) {
  const prefersReducedMotion = useReducedMotion()
  const cor = corCategoria(crise.categorias)

  const anoFim = crise.data_fim ? new Date(crise.data_fim).getFullYear() : anoAtual
  const duracao = Math.max(1, anoFim - crise.ano + 1)
  const larguraBarra = duracao * larguraPorAno

  const nivel = indice % 2
  const barY = nivel === 0 ? 40 : 64
  const barHeight = 18
  const circleY = nivel === 0 ? 34 : 58
  const lineY2 = barY + barHeight

  return (
    <motion.g
      onClick={() => onClick(crise.slug)}
      style={{ cursor: 'pointer' }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
    >
      <title>{crise.titulo} ({crise.ano})</title>

      {/* Barra de duração */}
      <rect
        x={posicaoX}
        y={barY}
        width={larguraBarra}
        height={barHeight}
        fill={cor}
        fillOpacity={0.45}
        stroke={cor}
        strokeWidth={1}
        rx={3}
      />

      {/* Linha vertical */}
      <line
        x1={posicaoX}
        y1={circleY}
        x2={posicaoX}
        y2={lineY2}
        stroke={cor}
        strokeWidth={1.5}
      />

      {/* Círculo clicável */}
      <circle
        cx={posicaoX}
        cy={circleY}
        r={5}
        fill={cor}
      />
    </motion.g>
  )
}
