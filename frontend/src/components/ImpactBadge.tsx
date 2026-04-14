import type { ImpactLabel } from '../types/feed'

interface ImpactBadgeProps {
  label: ImpactLabel
  score?: number
}

const impactStyles: Record<ImpactLabel, string> = {
  CRÍTICO: 'border border-red-600/40 bg-red-600/20 text-red-400',
  ALTO: 'border border-orange-600/40 bg-orange-600/20 text-orange-400',
  MÉDIO: 'border border-yellow-600/40 bg-yellow-600/20 text-yellow-400',
  MONITORAR: 'border border-blue-600/40 bg-blue-600/20 text-blue-400',
}

export function ImpactBadge({ label, score }: ImpactBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs uppercase tracking-[0.18em] ${impactStyles[label]}`}
    >
      {label}
      {typeof score === 'number' ? ` (${score})` : ''}
    </span>
  )
}
