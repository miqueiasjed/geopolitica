import { useState } from 'react'
import { motion } from 'framer-motion'
import { useEleicoes } from '../hooks/useEleicoes'
import { EleicaoFilterBar } from '../components/eleicoes/EleicaoFilterBar'
import { RadarGrid } from '../components/eleicoes/RadarGrid'
import { EleicaoDetailPanel } from '../components/eleicoes/EleicaoDetailPanel'
import type { FiltrosEleicao, RelevanciaEleicao } from '../types/eleicao'

const ANO_ATUAL = new Date().getFullYear()

function SkeletonGrid() {
  return (
    <div className="grid min-w-[900px] grid-cols-12 overflow-x-auto">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={`border-b border-zinc-800 px-2 py-2 ${i > 0 ? 'border-l' : ''}`}>
          <div className="h-3 rounded bg-zinc-800 animate-pulse" />
        </div>
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`col-${i}`}
          className={`min-h-[120px] p-2 ${i > 0 ? 'border-l border-zinc-800/60' : ''}`}
        >
          {i % 3 === 0 && (
            <div className="h-10 rounded bg-zinc-800/60 animate-pulse" />
          )}
        </div>
      ))}
    </div>
  )
}

function ContadoresRelevancia({
  eleicoes,
}: {
  eleicoes: { relevancia: RelevanciaEleicao }[]
}) {
  const alta = eleicoes.filter((e) => e.relevancia === 'alta').length
  const media = eleicoes.filter((e) => e.relevancia === 'media').length
  const baixa = eleicoes.filter((e) => e.relevancia === 'baixa').length

  return (
    <div className="flex items-center gap-4 font-mono text-xs">
      <span>
        <span className="text-[#EF4444]">{alta}</span>
        <span className="ml-1 uppercase tracking-[0.14em] text-zinc-500">alta</span>
      </span>
      <span className="text-zinc-700">|</span>
      <span>
        <span className="text-[#FACC15]">{media}</span>
        <span className="ml-1 uppercase tracking-[0.14em] text-zinc-500">média</span>
      </span>
      <span className="text-zinc-700">|</span>
      <span>
        <span className="text-zinc-400">{baixa}</span>
        <span className="ml-1 uppercase tracking-[0.14em] text-zinc-500">baixa</span>
      </span>
    </div>
  )
}

export function RadarEleicoes() {
  const [filtros, setFiltros] = useState<FiltrosEleicao>({ ano: ANO_ATUAL })
  const [eleicaoIdSelecionada, setEleicaoIdSelecionada] = useState<number | null>(null)

  const { eleicoes, isLoading } = useEleicoes(filtros)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-zinc-200"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/75">
            Módulo Geopolítico
          </p>
          <h1 className="text-3xl font-bold text-[#E8E4DC]">Radar de Eleições</h1>
          <p className="text-sm text-zinc-500">
            Mapeamento de eleições globais e seu impacto nos investimentos
          </p>
        </div>

        {/* Filtros + contadores */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <EleicaoFilterBar filtros={filtros} onChange={setFiltros} />
          {!isLoading && <ContadoresRelevancia eleicoes={eleicoes} />}
        </div>

        {/* Grade de eleições */}
        <div className="rounded-lg border border-zinc-800 bg-[#111318] p-4">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <RadarGrid
              eleicoes={eleicoes}
              onEleicaoClick={(id) => setEleicaoIdSelecionada(id)}
            />
          )}
        </div>
      </div>

      {/* Painel de detalhe */}
      <EleicaoDetailPanel
        eleicaoId={eleicaoIdSelecionada}
        onClose={() => setEleicaoIdSelecionada(null)}
      />
    </motion.div>
  )
}
