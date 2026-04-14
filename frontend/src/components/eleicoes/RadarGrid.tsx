import { EleicaoCard } from './EleicaoCard'
import type { Eleicao } from '../../types/eleicao'

interface RadarGridProps {
  eleicoes: Eleicao[]
  onEleicaoClick: (id: number) => void
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export function RadarGrid({ eleicoes, onEleicaoClick }: RadarGridProps) {
  const mesAtual = new Date().getMonth()

  const eleicoesPorMes = Array.from({ length: 12 }, (_, i) =>
    eleicoes.filter((e) => new Date(e.data_eleicao).getMonth() === i),
  )

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[900px] grid-cols-12">
        {/* Header dos meses */}
        {MESES_ABREV.map((mes, index) => {
          const eAtual = index === mesAtual
          return (
            <div
              key={mes}
              className={`border-b border-zinc-800 px-2 py-2 text-center font-mono text-xs uppercase tracking-[0.16em] ${
                eAtual ? 'text-[#C9B882]' : 'text-zinc-500'
              } ${index > 0 ? 'border-l border-zinc-800' : ''}`}
              style={
                eAtual
                  ? { borderBottom: '2px solid #C9B882' }
                  : undefined
              }
            >
              {mes}
            </div>
          )
        })}

        {/* Colunas de eleições */}
        {eleicoesPorMes.map((lista, index) => {
          const eAtual = index === mesAtual
          return (
            <div
              key={index}
              className={`flex min-h-[120px] flex-col gap-2 p-2 ${
                index > 0 ? 'border-l border-zinc-800/60' : ''
              } ${eAtual ? 'border-l border-r' : ''}`}
              style={
                eAtual
                  ? { borderLeftColor: '#C9B882', borderRightColor: '#C9B882', borderLeftWidth: index > 0 ? '1px' : '0', borderRightWidth: '1px' }
                  : undefined
              }
            >
              {lista.length === 0 ? (
                <p className="my-auto text-center font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-700">
                  Sem eleições
                </p>
              ) : (
                lista.map((eleicao) => (
                  <EleicaoCard key={eleicao.id} eleicao={eleicao} onClick={onEleicaoClick} />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
