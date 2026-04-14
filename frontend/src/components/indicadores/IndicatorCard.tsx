import type { Indicador, IndicadorHistoricoItem } from '../../types/indicadores'

interface SparklineProps {
  historico: IndicadorHistoricoItem[]
  positivo: boolean
}

function Sparkline({ historico, positivo }: SparklineProps) {
  if (historico.length === 0) return null

  const largura = 64
  const altura = 28

  const valores = historico.map((item) => item.valor)
  const minValor = Math.min(...valores)
  const maxValor = Math.max(...valores)
  const intervalo = maxValor - minValor

  const pontos = valores.map((valor, index) => {
    const x = (index / (valores.length - 1)) * largura
    const y =
      intervalo === 0
        ? altura / 2
        : altura - ((valor - minValor) / intervalo) * altura
    return `${x},${y}`
  })

  const cor = positivo ? '#4ade80' : '#f87171'

  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      aria-hidden="true"
    >
      <polyline
        points={pontos.join(' ')}
        fill="none"
        stroke={cor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function formatarValor(valor: number | null, moeda: 'USD' | 'BRL'): string {
  if (valor === null) return '—'
  const formatado = valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return moeda === 'USD' ? `$ ${formatado}` : `R$ ${formatado}`
}

interface VariacaoProps {
  variacao_pct: number | null
}

function Variacao({ variacao_pct }: VariacaoProps) {
  if (variacao_pct === null) {
    return <span className="text-zinc-400 text-xs">—</span>
  }

  if (variacao_pct > 0) {
    return (
      <span className="text-green-400 text-xs">
        ▲ {variacao_pct.toFixed(2)}%
      </span>
    )
  }

  if (variacao_pct < 0) {
    return (
      <span className="text-red-400 text-xs">
        ▼ {Math.abs(variacao_pct).toFixed(2)}%
      </span>
    )
  }

  return <span className="text-zinc-400 text-xs">0.00%</span>
}

interface IndicatorCardProps {
  indicador: Indicador
  historico?: IndicadorHistoricoItem[]
}

export function IndicatorCard({ indicador, historico }: IndicatorCardProps) {
  const temSparkline = historico !== undefined && historico.length > 0
  const positivo = (indicador.variacao_pct ?? 0) >= 0

  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 min-w-[140px]">
      <span className="text-zinc-400 text-xs truncate">{indicador.nome}</span>
      <span className="text-white font-semibold text-sm">
        {formatarValor(indicador.valor, indicador.moeda)}
      </span>
      <div className="flex items-center justify-between gap-2">
        <Variacao variacao_pct={indicador.variacao_pct} />
        {temSparkline && (
          <Sparkline historico={historico} positivo={positivo} />
        )}
      </div>
    </div>
  )
}
