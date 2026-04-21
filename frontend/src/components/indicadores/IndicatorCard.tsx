import type { Indicador, IndicadorHistoricoItem } from '../../types/indicadores'

interface SparklineProps {
  historico: IndicadorHistoricoItem[]
  positivo: boolean
}

function Sparkline({ historico, positivo }: SparklineProps) {
  if (historico.length === 0) return null

  const largura = 46
  const altura = 18

  const valores = historico
    .map((item) => Number(item.valor))
    .filter((valor) => Number.isFinite(valor))

  if (valores.length < 2) return null

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

  const cor = positivo ? '#2dd66f' : '#fb7185'

  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      className="shrink-0"
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

function formatarValor(
  valor: number | string | null | undefined,
  moeda: 'USD' | 'BRL' | null | undefined,
): string {
  if (valor === null || valor === undefined) return '—'

  const valorNumerico = typeof valor === 'number' ? valor : Number(valor)

  if (!Number.isFinite(valorNumerico)) return '—'

  const formatado = valorNumerico.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return moeda === 'USD' ? `$ ${formatado}` : `R$ ${formatado}`
}

interface VariacaoProps {
  variacao_pct: number | null | undefined
}

function Variacao({ variacao_pct }: VariacaoProps) {
  const variacao = variacao_pct === undefined ? null : Number(variacao_pct)

  if (variacao === null || !Number.isFinite(variacao)) {
    return <span className="text-zinc-400 text-xs">—</span>
  }

  if (variacao > 0) {
    return (
      <span className="font-mono text-[11px] leading-none text-emerald-300">
        ▲ {variacao.toFixed(2)}%
      </span>
    )
  }

  if (variacao < 0) {
    return (
      <span className="font-mono text-[11px] leading-none text-rose-300">
        ▼ {Math.abs(variacao).toFixed(2)}%
      </span>
    )
  }

  return (
    <span className="font-mono text-[11px] leading-none text-zinc-500">
      0.00%
    </span>
  )
}

interface IndicatorCardProps {
  indicador: Indicador
  historico?: IndicadorHistoricoItem[]
}

export function IndicatorCard({ indicador, historico }: IndicatorCardProps) {
  const temSparkline = historico !== undefined && historico.length > 0
  const positivo = (indicador.variacao_pct ?? 0) >= 0

  return (
    <article className="grid h-12 min-w-[156px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 border-l border-white/8 px-3 transition-colors first:border-l-0 hover:bg-white/[0.03]">
      <div className="min-w-0">
        <h3 className="truncate font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-zinc-500">
          {indicador.nome}
        </h3>
        <div className="mt-1.5 flex min-w-0 items-baseline gap-2">
          <p className="truncate whitespace-nowrap text-sm font-semibold leading-none text-zinc-100">
            {formatarValor(indicador.valor, indicador.moeda)}
          </p>
          <Variacao variacao_pct={indicador.variacao_pct} />
        </div>
      </div>
      <div className="flex items-center">
        {temSparkline ? (
          <Sparkline historico={historico} positivo={positivo} />
        ) : (
          <div className="h-[18px] w-[46px]" aria-hidden="true" />
        )}
      </div>
    </article>
  )
}
