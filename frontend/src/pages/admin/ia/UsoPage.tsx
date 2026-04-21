import { useAiUso } from '../../../hooks/useAiUso'
import type { AiUsoResumo, AiUsoServico } from '../../../types/ai'
import { AiUsoGrafico } from '../../../components/admin/AiUsoGrafico'

// ─── Formatadores ─────────────────────────────────────────────────────────────

function formatarCusto(valor: number): string {
  if (valor < 0.01) return `$${valor.toFixed(6)}`
  if (valor < 1) return `$${valor.toFixed(4)}`
  return `$${valor.toFixed(2)}`
}

function formatarTokens(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

function formatarDuracao(valor: number): string {
  return `${Math.round(valor).toLocaleString('pt-BR')} ms`
}

// ─── Card de resumo ───────────────────────────────────────────────────────────

interface CardResumoProps {
  label: string
  valor: string
  subtitulo?: string
}

function CardResumo({ label, valor, subtitulo }: CardResumoProps) {
  return (
    <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] px-5 py-4 space-y-1">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold text-white">{valor}</p>
      {subtitulo && (
        <p className="font-mono text-[11px] text-zinc-600 uppercase tracking-[0.14em]">{subtitulo}</p>
      )}
    </div>
  )
}

// ─── Skeleton de loading ──────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      className="h-24 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]"
      aria-hidden="true"
    />
  )
}

// ─── Tabela de serviços ───────────────────────────────────────────────────────

interface TabelaServicosProps {
  servicos: AiUsoServico[]
}

function TabelaServicos({ servicos }: TabelaServicosProps) {
  const ordenados = [...servicos].sort((a, b) => b.chamadas - a.chamadas)

  return (
    <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] overflow-hidden">
      <div className="border-b border-[#1e1e20] px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-100">Breakdown por Serviço</h2>
        <p className="mt-0.5 text-xs text-zinc-500">Mês atual — ordenado por volume de chamadas</p>
      </div>

      {ordenados.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">
          Nenhuma chamada registrada este mês.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e20]">
              <th className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Serviço
              </th>
              <th className="px-5 py-3 text-right font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Chamadas
              </th>
              <th className="px-5 py-3 text-right font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Custo Estimado
              </th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((servico, idx) => (
              <tr
                key={servico.servico}
                className={idx % 2 === 0 ? 'bg-transparent' : 'bg-[#111113]'}
              >
                <td className="px-5 py-3 text-zinc-200 font-mono text-xs">{servico.servico}</td>
                <td className="px-5 py-3 text-right text-zinc-300 tabular-nums">
                  {servico.chamadas.toLocaleString('pt-BR')}
                </td>
                <td className="px-5 py-3 text-right text-zinc-300 font-mono tabular-nums">
                  {formatarCusto(servico.custo_estimado_usd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Cards de grupo ───────────────────────────────────────────────────────────

interface CardsResumoGrupoProps {
  titulo: string
  resumo: AiUsoResumo
  providerAtivo?: string
  modeloAtivo?: string
}

function CardsResumoGrupo({ titulo, resumo, providerAtivo, modeloAtivo }: CardsResumoGrupoProps) {
  return (
    <div className="space-y-3">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">
        {titulo}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardResumo
          label="Chamadas"
          valor={resumo.chamadas.toLocaleString('pt-BR')}
        />
        <CardResumo
          label="Tokens"
          valor={formatarTokens(resumo.tokens_entrada + resumo.tokens_saida)}
          subtitulo={`entrada: ${formatarTokens(resumo.tokens_entrada)} · saída: ${formatarTokens(resumo.tokens_saida)}`}
        />
        <CardResumo
          label="Custo Estimado"
          valor={formatarCusto(resumo.custo_estimado_usd)}
          subtitulo="estimado"
        />
        {providerAtivo !== undefined ? (
          <CardResumo
            label="Provider / Modelo"
            valor={providerAtivo}
            subtitulo={modeloAtivo}
          />
        ) : (
          <CardResumo
            label="Duração Média"
            valor={formatarDuracao(resumo.duracao_media_ms)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function UsoPage() {
  const { data, isLoading, isError } = useAiUso()

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">
          admin · ia
        </p>
        <h1 className="text-2xl font-semibold text-white">Painel de Uso da IA</h1>
        <p className="text-sm text-zinc-400">
          Monitoramento de chamadas, tokens e custo estimado por período.
        </p>
      </div>

      {/* Aviso de threshold */}
      {data && data.mes.custo_estimado_usd >= data.threshold_alerta_usd && (
        <div
          className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
          role="alert"
        >
          <span className="mt-0.5 text-amber-400 text-base" aria-hidden="true">⚠</span>
          <p className="text-sm text-amber-300">
            Custo estimado do mês ({formatarCusto(data.mes.custo_estimado_usd)}) atingiu o limite de alerta ({formatarCusto(data.threshold_alerta_usd)}).
          </p>
        </div>
      )}

      {/* Estado de erro */}
      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Não foi possível carregar os dados de uso. Tente novamente em instantes.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="h-4 w-16 animate-pulse rounded bg-[#1e1e20]" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-[#1e1e20]" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
            </div>
          </div>
          <div className="h-48 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]" />
        </div>
      )}

      {/* Dados */}
      {data && !isLoading && (
        <>
          {/* Cards de Hoje */}
          <CardsResumoGrupo titulo="Hoje" resumo={data.hoje} />

          {/* Cards do Mês */}
          <CardsResumoGrupo
            titulo="Mês Atual"
            resumo={data.mes}
            providerAtivo={data.provider_ativo}
            modeloAtivo={data.modelo_ativo}
          />

          {/* Gráfico de barras 7 dias */}
          <AiUsoGrafico
            historico={data.historico_7_dias}
            providerAtivo={data.provider_ativo}
            modeloAtivo={data.modelo_ativo}
          />

          {/* Tabela de breakdown por serviço */}
          <TabelaServicos servicos={data.por_servico} />
        </>
      )}
    </div>
  )
}
