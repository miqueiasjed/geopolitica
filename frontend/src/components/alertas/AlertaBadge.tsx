import { motion, useReducedMotion } from 'framer-motion'
import { useAlertas } from '../../hooks/useAlertas'

interface AlertaBadgeProps {
  onTogglePanel: () => void
}

function formatarContagem(total: number): string {
  return total > 99 ? '99+' : String(total)
}

export function AlertaBadge({ onTogglePanel }: AlertaBadgeProps) {
  const { totalNaoLidos } = useAlertas()
  const prefersReduced = useReducedMotion()

  const ariaLabel =
    totalNaoLidos > 0
      ? `Alertas: ${totalNaoLidos} não lido${totalNaoLidos > 1 ? 's' : ''}`
      : 'Alertas: nenhum pendente'

  const pulseAnimation = prefersReduced
    ? {}
    : {
        scale: [1, 1.15, 1],
        transition: {
          duration: 0.7,
          ease: 'easeInOut' as const,
          repeat: Infinity,
          repeatDelay: 2,
        },
      }

  return (
    <button
      type="button"
      onClick={onTogglePanel}
      aria-label={ariaLabel}
      className="relative inline-flex items-center justify-center rounded-full p-2 text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF3C]/50"
    >
      {/* Ícone de sino */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {/* Badge de contagem */}
      {totalNaoLidos > 0 && (
        <motion.span
          key="badge"
          animate={pulseAnimation}
          initial={prefersReduced ? false : { scale: 0.8, opacity: 0 }}
          whileInView={prefersReduced ? {} : { scale: 1, opacity: 1 }}
          className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-semibold leading-[18px] text-white"
        >
          {formatarContagem(totalNaoLidos)}
        </motion.span>
      )}
    </button>
  )
}
