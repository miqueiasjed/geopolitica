import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import type { EleicaoDetalhe, RelevanciaEleicao } from '../../types/eleicao'
import { CORES_RELEVANCIA } from '../../types/eleicao'

interface EleicaoDetailPanelProps {
  eleicaoId: number | null
  onClose: () => void
}

const eleicaoDetalheKeys = {
  detalhe: (id: number) => ['eleicao-detalhe', id] as const,
}

async function fetchEleicaoDetalhe(id: number): Promise<EleicaoDetalhe> {
  const response = await api.get<EleicaoDetalhe>(`/eleicoes/${id}`)
  return response.data
}

const LABEL_RELEVANCIA: Record<RelevanciaEleicao, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

function formatarData(dataStr: string): string {
  const date = new Date(dataStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function BadgeRelevancia({ relevancia }: { relevancia: RelevanciaEleicao }) {
  const cor = CORES_RELEVANCIA[relevancia]
  return (
    <span
      className="rounded px-2 py-0.5 font-mono text-xs uppercase tracking-[0.14em]"
      style={{ color: cor, backgroundColor: `${cor}1A`, border: `1px solid ${cor}4D` }}
    >
      {LABEL_RELEVANCIA[relevancia]}
    </span>
  )
}

function SkeletonPanel() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-end">
        <div className="h-5 w-5 rounded bg-[#2D3240] animate-pulse" />
      </div>
      <div className="h-8 w-2/3 rounded bg-[#2D3240] animate-pulse" />
      <div className="h-4 w-1/3 rounded bg-[#2D3240] animate-pulse" />
      <div className="mt-6 space-y-2">
        <div className="h-4 w-full rounded bg-[#2D3240] animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-[#2D3240] animate-pulse" />
        <div className="h-4 w-4/6 rounded bg-[#2D3240] animate-pulse" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded bg-[#2D3240] animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-[#2D3240] animate-pulse" />
      </div>
    </div>
  )
}

export function EleicaoDetailPanel({ eleicaoId, onClose }: EleicaoDetailPanelProps) {
  const prefersReduced = useReducedMotion()

  const { data: eleicao, isLoading } = useQuery({
    queryKey: eleicaoId ? eleicaoDetalheKeys.detalhe(eleicaoId) : ['eleicao-detalhe-noop'],
    queryFn: () => fetchEleicaoDetalhe(eleicaoId!),
    enabled: !!eleicaoId,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <AnimatePresence>
      {eleicaoId && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            className="fixed inset-0 z-40 bg-black/50"
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Painel deslizante */}
          <motion.div
            key="painel"
            initial={prefersReduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', damping: 25, stiffness: 200 }
            }
            className="fixed right-0 top-0 h-full w-[440px] overflow-y-auto bg-[#1C1F26] z-50 border-l border-[#2D3240]"
            role="dialog"
            aria-modal="true"
            aria-label="Detalhes da eleição"
          >
            {isLoading ? (
              <SkeletonPanel />
            ) : eleicao ? (
              <div className="p-6">
                {/* Botão fechar */}
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar painel"
                    className="text-[#6B7280] transition-colors hover:text-[#E8E4DC] text-xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Header: bandeira + país + badge relevância */}
                <div className="mb-5">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span
                      className="text-3xl"
                      role="img"
                      aria-label={`Bandeira de ${eleicao.pais}`}
                    >
                      {getFlagEmoji(eleicao.codigo_pais)}
                    </span>
                    <h2 className="text-xl font-bold text-[#E8E4DC]">{eleicao.pais}</h2>
                    <BadgeRelevancia relevancia={eleicao.relevancia} />
                  </div>

                  {/* Data e tipo */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="font-mono text-sm text-[#C9B882]">
                      {formatarData(eleicao.data_eleicao)}
                    </span>
                    <span className="rounded bg-[#2D3240] px-2 py-0.5 font-mono text-xs text-zinc-400">
                      {eleicao.tipo_eleicao}
                    </span>
                  </div>
                </div>

                {/* Candidatos principais */}
                {eleicao.candidatos_principais && eleicao.candidatos_principais.length > 0 && (
                  <>
                    <hr className="my-4 border-[#2D3240]" />
                    <section>
                      <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#C9B882]">
                        Candidatos Principais
                      </h3>
                      <ul className="space-y-2">
                        {eleicao.candidatos_principais.map((candidato, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between rounded bg-[#0F1117] px-3 py-2"
                          >
                            <span className="text-sm text-[#E8E4DC]">{candidato.nome}</span>
                            {candidato.partido && (
                              <span className="ml-2 font-mono text-xs text-zinc-500">
                                {candidato.partido}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )}

                {/* Contexto geopolítico */}
                {eleicao.contexto_geopolitico && (
                  <>
                    <hr className="my-4 border-[#2D3240]" />
                    <section>
                      <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[#C9B882]">
                        Contexto Geopolítico
                      </h3>
                      <p className="text-sm leading-relaxed text-[#E8E4DC]">
                        {eleicao.contexto_geopolitico}
                      </p>
                    </section>
                  </>
                )}

                {/* Impacto no Brasil */}
                {eleicao.impacto_brasil && (
                  <>
                    <hr className="my-4 border-[#2D3240]" />
                    <section>
                      <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[#C9B882]">
                        Impacto no Brasil
                      </h3>
                      <div className="rounded border border-[#C9B882]/20 bg-[#C9B882]/5 p-3">
                        <p className="text-sm leading-relaxed text-[#E8E4DC]">
                          {eleicao.impacto_brasil}
                        </p>
                      </div>
                    </section>
                  </>
                )}

                {/* Botão Ver na Biblioteca */}
                {eleicao.content_slug && (
                  <div className="mt-6">
                    <Link
                      to={`/dashboard/biblioteca/${eleicao.content_slug}`}
                      className="inline-flex items-center gap-1 text-sm text-[#C9B882] transition-colors hover:text-[#E8E4DC]"
                    >
                      Ver na Biblioteca →
                    </Link>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Converte código de país ISO 3166-1 alpha-2 para emoji de bandeira.
 * Funciona em sistemas que suportam Regional Indicator Symbols.
 */
function getFlagEmoji(codigoPais: string): string {
  const codigo = codigoPais.toUpperCase().slice(0, 2)
  if (!/^[A-Z]{2}$/.test(codigo)) return '🌍'
  const base = 0x1F1E6
  const charA = 65
  return String.fromCodePoint(base + codigo.charCodeAt(0) - charA) +
    String.fromCodePoint(base + codigo.charCodeAt(1) - charA)
}
