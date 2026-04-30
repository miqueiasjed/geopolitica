import { CORES_RELEVANCIA } from '../../types/eleicao'
import type { FiltrosEleicao, RelevanciaEleicao } from '../../types/eleicao'

interface EleicaoFilterBarProps {
  filtros: FiltrosEleicao
  onChange: (filtros: FiltrosEleicao) => void
}

const ANOS = [2024, 2025, 2026, 2027, 2028] as const

interface OpcaoRelevancia {
  label: string
  value: RelevanciaEleicao | undefined
}

const OPCOES_RELEVANCIA: OpcaoRelevancia[] = [
  { label: 'Todas', value: undefined },
  { label: 'Alta', value: 'alta' },
  { label: 'Média', value: 'media' },
  { label: 'Baixa', value: 'baixa' },
]

export function EleicaoFilterBar({ filtros, onChange }: EleicaoFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Select de ano */}
      <select
        value={filtros.ano}
        onChange={(e) => onChange({ ...filtros, ano: Number(e.target.value) })}
        className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-300 transition-colors focus:border-[#BFFF3C] focus:outline-none focus:ring-1 focus:ring-[#BFFF3C]"
        aria-label="Filtrar por ano"
      >
        {ANOS.map((ano) => (
          <option key={ano} value={ano}>
            {ano}
          </option>
        ))}
      </select>

      {/* Toggle buttons de relevância */}
      <div className="flex gap-2">
        {OPCOES_RELEVANCIA.map((opcao) => {
          const ativa = filtros.relevancia === opcao.value
          const cor = opcao.value ? CORES_RELEVANCIA[opcao.value] : undefined

          return (
            <button
              key={opcao.label}
              type="button"
              onClick={() => onChange({ ...filtros, relevancia: opcao.value })}
              aria-pressed={ativa}
              className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                ativa
                  ? 'border border-current/30 bg-current/10'
                  : 'border border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
              style={
                ativa && cor
                  ? { color: cor, borderColor: `${cor}4D`, backgroundColor: `${cor}1A` }
                  : ativa && !cor
                    ? { color: '#BFFF3C', borderColor: 'rgba(191,255,60,0.3)', backgroundColor: 'rgba(191,255,60,0.1)' }
                    : undefined
              }
            >
              {opcao.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
