import { motion, useReducedMotion } from 'framer-motion'
import { CORES_RELEVANCIA } from '../../types/eleicao'
import type { Eleicao, RelevanciaEleicao } from '../../types/eleicao'
import { formatarDataEleicao } from '../../utils/eleicoes'

interface EleicaoCardProps {
  eleicao: Eleicao
  onClick: (id: number) => void
}

const BANDEIRAS: Record<string, string> = {
  DE: '🇩🇪',
  FR: '🇫🇷',
  BR: '🇧🇷',
  AR: '🇦🇷',
  MX: '🇲🇽',
  JP: '🇯🇵',
  IT: '🇮🇹',
  CO: '🇨🇴',
  CL: '🇨🇱',
  VE: '🇻🇪',
  IR: '🇮🇷',
  TR: '🇹🇷',
  NG: '🇳🇬',
  IN: '🇮🇳',
  KR: '🇰🇷',
  US: '🇺🇸',
  GB: '🇬🇧',
  CN: '🇨🇳',
  RU: '🇷🇺',
  ZA: '🇿🇦',
}

const BADGE_LABEL: Record<RelevanciaEleicao, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export function EleicaoCard({ eleicao, onClick }: EleicaoCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const cor = CORES_RELEVANCIA[eleicao.relevancia]
  const bandeira = BANDEIRAS[eleicao.codigo_pais] ?? '🏳️'

  const badgeStyle =
    eleicao.relevancia === 'baixa'
      ? { backgroundColor: 'rgba(232,228,220,0.15)', color: 'rgba(232,228,220,0.8)', borderColor: 'rgba(232,228,220,0.2)' }
      : eleicao.relevancia === 'media'
        ? { backgroundColor: 'rgba(250,204,21,0.15)', color: '#FACC15', borderColor: 'rgba(250,204,21,0.3)' }
        : { backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }

  return (
    <motion.button
      type="button"
      onClick={() => onClick(eleicao.id)}
      aria-label={`Ver detalhes da eleição: ${eleicao.pais}, ${formatarDataEleicao(eleicao.data_eleicao)}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: 'easeOut' }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      className="w-full rounded-lg border border-zinc-800 bg-[#111113] p-2 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF3C]"
      style={{ '--relevancia-cor': cor } as React.CSSProperties}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = cor }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
    >
      {/* Bandeira + Badge em linha */}
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="text-xl leading-none" role="img" aria-label={`Bandeira de ${eleicao.pais}`}>
          {bandeira}
        </span>
        <span
          className="inline-block rounded border px-1 py-px font-mono text-[9px] uppercase tracking-[0.1em]"
          style={badgeStyle}
        >
          {BADGE_LABEL[eleicao.relevancia]}
        </span>
      </div>

      {/* País */}
      <p className="mb-1 truncate text-xs font-semibold leading-tight text-white">
        {eleicao.pais}
      </p>

      {/* Data + Tipo */}
      <div className="space-y-px">
        <p className="font-mono text-[10px] text-zinc-400">
          {formatarDataEleicao(eleicao.data_eleicao)}
        </p>
        <p className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-zinc-600">
          {eleicao.tipo_eleicao}
        </p>
      </div>
    </motion.button>
  )
}
