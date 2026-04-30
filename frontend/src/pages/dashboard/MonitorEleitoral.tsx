import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '../../lib/axios'
import { useAddonAccess } from '../../hooks/useAddonAccess'
import { AddonGate } from '../../components/AddonGate'
import { EleicaoFilterBar } from '../../components/eleicoes/EleicaoFilterBar'
import { RadarGrid } from '../../components/eleicoes/RadarGrid'
import { EleicaoDetailPanel } from '../../components/eleicoes/EleicaoDetailPanel'
import { useEleicoes } from '../../hooks/useEleicoes'
import type { ConteudoCard } from '../../types/biblioteca'
import type { FiltrosEleicao } from '../../types/eleicao'
import { useState } from 'react'

const ANO_ATUAL = new Date().getFullYear()

async function fetchBriefingsEleitorais(): Promise<ConteudoCard[]> {
  const response = await api.get<ConteudoCard[]>('/conteudos', {
    params: { vertical: 'elections', publicado: true, limit: 10 },
  })
  return response.data
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#1e1e20] bg-[#111113] p-5">
      <div className="mb-3 flex gap-2">
        <div className="h-4 w-24 rounded bg-zinc-800" />
      </div>
      <div className="mb-1 h-5 w-3/4 rounded bg-zinc-800" />
      <div className="mt-2 space-y-2">
        <div className="h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-5/6 rounded bg-zinc-800" />
        <div className="h-4 w-4/6 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

function formatarData(iso: string): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
    .format(data)
    .replace('.', '')
}

function BriefingCard({ conteudo, onClick }: { conteudo: ConteudoCard; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-2xl border border-[#1e1e20] bg-[#111113] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:border-[#BFFF3C]/30"
    >
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
        {formatarData(conteudo.publicado_em)}
      </p>
      <h3 className="mb-1 text-base font-semibold leading-snug text-white">{conteudo.titulo}</h3>
      <p className="line-clamp-3 text-sm leading-6 text-zinc-400">{conteudo.resumo}</p>
    </article>
  )
}

function RadarSection() {
  const [filtros, setFiltros] = useState<FiltrosEleicao>({ ano: ANO_ATUAL })
  const [eleicaoIdSelecionada, setEleicaoIdSelecionada] = useState<number | null>(null)
  const { eleicoes, isLoading } = useEleicoes(filtros)

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-zinc-500">
        Radar de Eleições
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <EleicaoFilterBar filtros={filtros} onChange={setFiltros} />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-[#111318] p-4">
        {isLoading ? (
          <div className="grid min-w-[900px] grid-cols-12 overflow-x-auto">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`border-b border-zinc-800 px-2 py-2 ${i > 0 ? 'border-l' : ''}`}
              >
                <div className="h-3 animate-pulse rounded bg-zinc-800" />
              </div>
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`col-${i}`}
                className={`min-h-[120px] p-2 ${i > 0 ? 'border-l border-zinc-800/60' : ''}`}
              >
                {i % 3 === 0 && <div className="h-10 animate-pulse rounded bg-zinc-800/60" />}
              </div>
            ))}
          </div>
        ) : (
          <RadarGrid
            eleicoes={eleicoes}
            onEleicaoClick={(id: number) => setEleicaoIdSelecionada(id)}
          />
        )}
      </div>

      <EleicaoDetailPanel
        eleicaoId={eleicaoIdSelecionada}
        onClose={() => setEleicaoIdSelecionada(null)}
      />
    </div>
  )
}

function BriefingsSection() {
  const navigate = useNavigate()

  const { data: briefings, isLoading } = useQuery({
    queryKey: ['briefings-eleitorais'],
    queryFn: fetchBriefingsEleitorais,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-zinc-500">
        Briefings Eleitorais Recentes
      </p>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !briefings || briefings.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Nenhum briefing eleitoral disponível no momento.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {briefings.map((briefing) => (
            <BriefingCard
              key={briefing.id}
              conteudo={briefing}
              onClick={() => navigate(`/dashboard/biblioteca/${briefing.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MonitorEleitoral() {
  const temAcesso = useAddonAccess('elections')

  if (!temAcesso) {
    return <AddonGate addonKey="elections" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 text-zinc-200"
    >
      <div className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">VERTICAIS</p>
        <h1 className="font-serif text-3xl font-bold text-[#F7F7F2]">Monitor Eleitoral</h1>
        <p className="text-sm text-zinc-500">Eleições globais com impacto para investidores</p>
      </div>

      <RadarSection />
      <BriefingsSection />
    </motion.div>
  )
}
