import { motion, useReducedMotion } from 'framer-motion'

interface ScoreGaugeProps {
  valor: number
  label: string
  className?: string
}

type Nivel = 'ALTO' | 'MÉDIO' | 'BAIXO'

function getNivel(valor: number): Nivel {
  if (valor >= 70) return 'ALTO'
  if (valor >= 40) return 'MÉDIO'
  return 'BAIXO'
}

function getCorNivel(nivel: Nivel): string {
  if (nivel === 'ALTO') return '#EF4444'
  if (nivel === 'MÉDIO') return '#FACC15'
  return '#4ade80'
}

export function ScoreGauge({ valor, label, className = '' }: ScoreGaugeProps) {
  const prefersReduced = useReducedMotion()
  const nivel = getNivel(valor)
  const corNivel = getCorNivel(nivel)

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`border border-white/[0.08] rounded-xl p-4 ${className}`}
      style={{ backgroundColor: '#0d0d0f' }}
    >
      {/* Header: label + badge de nível */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50 uppercase tracking-widest">
          {label}
        </span>
        <span
          className="text-[10px] tracking-wider uppercase font-medium"
          style={{ color: corNivel }}
        >
          {nivel}
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${valor}%`, backgroundColor: corNivel }}
        />
      </div>

      {/* Valor numérico */}
      <div className="flex items-baseline mt-2">
        <span
          className="text-2xl font-mono font-medium"
          style={{ color: corNivel }}
        >
          {valor}
        </span>
        <span className="text-sm text-white/30 ml-1">/100</span>
      </div>
    </motion.div>
  )
}
