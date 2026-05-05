import { EleicaoCard } from './EleicaoCard'
import type { Eleicao } from '../../types/eleicao'
import { getMesEleicao } from '../../utils/eleicoes'

interface RadarGridProps {
  eleicoes: Eleicao[]
  onEleicaoClick: (id: number) => void
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export function RadarGrid({ eleicoes, onEleicaoClick }: RadarGridProps) {
  const mesAtual = new Date().getMonth()

  const eleicoesPorMes = Array.from({ length: 12 }, (_, i) =>
    eleicoes.filter((e) => getMesEleicao(e.data_eleicao) === i),
  )

  return (
    <div className="-mx-1 overflow-x-auto sm:mx-0">
      <div className="grid min-w-[720px] grid-cols-12">
        {/* Header dos meses */}
        {MESES_ABREV.map((mes, index) => {
          const eAtual = index === mesAtual
          return (
            <div
              key={mes}
              className={`border-b border-zinc-800 px-1 py-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] ${
                eAtual ? 'text-[#BFFF3C]' : 'text-zinc-500'
              } ${index > 0 ? 'border-l border-zinc-800' : ''}`}
              style={eAtual ? { borderBottom: '2px solid #BFFF3C' } : undefined}
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
              className={`flex min-h-[140px] flex-col gap-1.5 p-1.5 ${
                index > 0 ? 'border-l border-zinc-800/60' : ''
              } ${eAtual ? 'border-l border-r' : ''}`}
              style={
                eAtual
                  ? {
                      borderLeftColor: '#BFFF3C',
                      borderRightColor: '#BFFF3C',
                      borderLeftWidth: index > 0 ? '1px' : '0',
                      borderRightWidth: '1px',
                    }
                  : undefined
              }
            >
              {lista.length === 0 ? (
                <p className="my-auto text-center font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-800">
                  —
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
