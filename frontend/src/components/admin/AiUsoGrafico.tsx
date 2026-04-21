import type { AiUsoHistoricoDia } from '../../types/ai'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiUsoGraficoProps {
  historico: AiUsoHistoricoDia[]
  providerAtivo: string
  modeloAtivo: string
}

// ─── Preços de referência ─────────────────────────────────────────────────────

interface PrecoModelo {
  entrada: string
  saida: string
}

const PRECOS_REFERENCIA: Record<string, PrecoModelo> = {
  'claude-sonnet-4-6': { entrada: '$3/M', saida: '$15/M' },
  'claude-sonnet': { entrada: '$3/M', saida: '$15/M' },
  'gpt-4o': { entrada: '$2.50/M', saida: '$10/M' },
  'gpt-4o-mini': { entrada: '$0.15/M', saida: '$0.60/M' },
}

function obterPrecos(modeloAtivo: string): PrecoModelo {
  const chave = Object.keys(PRECOS_REFERENCIA).find((k) =>
    modeloAtivo.toLowerCase().includes(k.toLowerCase())
  )
  if (chave) return PRECOS_REFERENCIA[chave]
  // fallback por provider
  if (modeloAtivo.toLowerCase().includes('gpt-4o-mini'))
    return { entrada: '$0.15/M', saida: '$0.60/M' }
  if (modeloAtivo.toLowerCase().includes('gpt'))
    return { entrada: '$2.50/M', saida: '$10/M' }
  return { entrada: '$3/M', saida: '$15/M' }
}

// ─── Helpers de data ──────────────────────────────────────────────────────────

function formatarDataDDMM(isoDate: string): string {
  const [, mes, dia] = isoDate.split('-')
  return `${dia}/${mes}`
}

function somarDias(base: Date, dias: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + dias)
  return d
}

function dataParaISO(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Garante exatamente 7 entradas para os últimos 7 dias (D-6 … D+0) */
function completar7Dias(historico: AiUsoHistoricoDia[]): AiUsoHistoricoDia[] {
  const hoje = new Date()
  // Normaliza para meia-noite local
  hoje.setHours(0, 0, 0, 0)

  const mapa = new Map<string, AiUsoHistoricoDia>()
  for (const item of historico) {
    mapa.set(item.data, item)
  }

  const resultado: AiUsoHistoricoDia[] = []
  for (let i = 6; i >= 0; i--) {
    const d = somarDias(hoje, -i)
    const iso = dataParaISO(d)
    resultado.push(
      mapa.get(iso) ?? { data: iso, chamadas: 0, custo_estimado_usd: 0 }
    )
  }
  return resultado
}

// ─── Formatador de custo para tooltip ────────────────────────────────────────

function formatarCustoTooltip(valor: number): string {
  if (valor < 0.01) return `$${valor.toFixed(6)}`
  if (valor < 1) return `$${valor.toFixed(4)}`
  return `$${valor.toFixed(2)}`
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AiUsoGrafico({ historico, providerAtivo, modeloAtivo }: AiUsoGraficoProps) {
  const dias = completar7Dias(historico)
  const maxCusto = Math.max(...dias.map((d) => d.custo_estimado_usd))

  const isClaude = providerAtivo.toLowerCase() === 'claude'
  const corBarra = isClaude ? 'bg-blue-500' : 'bg-green-500'
  const corBadge = isClaude
    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    : 'bg-green-500/15 text-green-300 border-green-500/30'
  const corPonto = isClaude ? 'bg-blue-400' : 'bg-green-400'

  const precos = obterPrecos(modeloAtivo)

  return (
    <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] px-5 py-4 space-y-4">
      {/* Cabeçalho com badge de provider */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-zinc-100">Histórico 7 dias</h2>
          <p className="text-xs text-zinc-500">Custo estimado por dia (USD)</p>
        </div>

        {/* Badge provider + preços */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] ${corBadge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${corPonto}`} aria-hidden="true" />
            {modeloAtivo || providerAtivo}
          </span>
          <span className="font-mono text-[10px] text-zinc-600">
            {precos.entrada} entrada · {precos.saida} saída
          </span>
        </div>
      </div>

      {/* Gráfico de barras CSS puro */}
      <div
        role="img"
        aria-label={`Gráfico de barras dos últimos 7 dias de uso da IA`}
        className="w-full"
      >
        {/* Container das barras */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            height: '120px',
          }}
        >
          {dias.map((dia) => {
            const alturaPct =
              maxCusto === 0
                ? 0
                : (dia.custo_estimado_usd / maxCusto) * 100

            const alturaFinal =
              maxCusto === 0 ? '4px' : `max(4px, ${alturaPct}%)`

            const tooltipTexto = `${formatarDataDDMM(dia.data)}: ${dia.chamadas} chamadas · ${formatarCustoTooltip(dia.custo_estimado_usd)}`

            return (
              <div
                key={dia.data}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
              >
                <div
                  title={tooltipTexto}
                  aria-label={tooltipTexto}
                  style={{ width: '100%', height: alturaFinal, transition: 'height 0.3s ease' }}
                  className={`rounded-sm ${corBarra} hover:brightness-125 cursor-default transition-[filter]`}
                />
              </div>
            )
          })}
        </div>

        {/* Labels DD/MM */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '6px',
          }}
        >
          {dias.map((dia) => (
            <div
              key={`label-${dia.data}`}
              style={{ flex: 1 }}
              className="text-center font-mono text-[10px] text-zinc-600 select-none"
            >
              {formatarDataDDMM(dia.data)}
            </div>
          ))}
        </div>
      </div>

      {/* Mensagem quando sem dados */}
      {maxCusto === 0 && (
        <p className="text-center font-mono text-[11px] text-zinc-600">
          Sem dados registrados nos últimos 7 dias
        </p>
      )}
    </div>
  )
}
