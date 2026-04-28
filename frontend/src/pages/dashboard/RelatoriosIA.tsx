import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import api from '../../lib/axios'

interface RelatorioResumo {
  id: string
  topico: string
  title: string
  word_count: number
  created_at: string
}

interface RelatorioDetalhe extends RelatorioResumo {
  body: string
}

interface RelatoriosResponse {
  data: RelatorioResumo[]
}

async function fetchRelatorios(): Promise<RelatorioResumo[]> {
  const res = await api.get<RelatoriosResponse>('/relatorios')
  return res.data.data ?? res.data
}

async function fetchRelatorio(id: string): Promise<RelatorioDetalhe> {
  const res = await api.get<RelatorioDetalhe>(`/relatorios/${id}`)
  return res.data
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[#1e1e20] bg-[#111113] p-5">
      <div className="mb-3 h-4 w-1/3 rounded bg-zinc-800" />
      <div className="mb-2 h-5 w-2/3 rounded bg-zinc-800" />
      <div className="flex gap-3">
        <div className="h-3 w-16 rounded bg-zinc-800" />
        <div className="h-3 w-20 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function RelatoriosIA() {
  const prefersReduced = useReducedMotion()
  const navigate = useNavigate()
  const [relatorioAberto, setRelatorioAberto] = useState<string | null>(null)

  const { data: relatorios = [], isLoading } = useQuery<RelatorioResumo[]>({
    queryKey: ['relatorios'],
    queryFn: fetchRelatorios,
  })

  const { data: relatorioDetalhe, isLoading: carregandoDetalhe } = useQuery<RelatorioDetalhe>({
    queryKey: ['relatorio', relatorioAberto],
    queryFn: () => fetchRelatorio(relatorioAberto!),
    enabled: relatorioAberto !== null,
  })

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#C9B882]/70">
            Inteligência Artificial
          </p>
          <h1 className="font-serif text-xl font-semibold text-white">Relatórios</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/relatorios/novo')}
          className="flex-shrink-0 rounded-full border border-[#C9B882]/40 bg-[#C9B882]/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#C9B882] transition-all hover:bg-[#C9B882]/20"
        >
          Novo relatório →
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : relatorios.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-[#0f1117] py-20 text-center">
          <p className="text-sm text-zinc-500">Nenhum relatório gerado ainda.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/relatorios/novo')}
            className="rounded-full border border-zinc-700 px-5 py-2 font-mono text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:border-[#C9B882]/40 hover:text-[#C9B882]"
          >
            Criar primeiro relatório →
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {relatorios.map((rel) => (
            <motion.div key={rel.id} variants={itemVariants}>
              <button
                type="button"
                onClick={() =>
                  setRelatorioAberto((prev) => (prev === rel.id ? null : rel.id))
                }
                className="w-full rounded-xl border border-zinc-800 bg-[#0f1117] p-5 text-left transition-colors hover:border-zinc-700 hover:bg-[#111113]"
                aria-expanded={relatorioAberto === rel.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                      {formatarData(rel.created_at)}
                    </p>
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {rel.title ?? rel.topico}
                    </p>
                    <p className="line-clamp-1 text-xs text-zinc-500">{rel.topico}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {rel.word_count > 0 && (
                      <span className="rounded-full border border-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
                        {rel.word_count.toLocaleString('pt-BR')} palavras
                      </span>
                    )}
                    <span
                      className={`font-mono text-xs text-zinc-500 transition-transform duration-200 ${
                        relatorioAberto === rel.id ? 'rotate-90' : ''
                      }`}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </div>
                </div>
              </button>

              {/* Conteúdo expandido */}
              <AnimatePresence>
                {relatorioAberto === rel.id && (
                  <motion.div
                    key={`detalhe-${rel.id}`}
                    initial={prefersReduced ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeOut' }}
                    className="mt-1 rounded-xl border border-white/8 bg-[#0f1117] p-6"
                  >
                    {carregandoDetalhe ? (
                      <div className="flex justify-center py-8" aria-label="Carregando relatório">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-[#C9B882]" />
                      </div>
                    ) : relatorioDetalhe ? (
                      <div className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-strong:text-zinc-100 prose-li:text-zinc-300 prose-a:text-[#C9B882]">
                        <ReactMarkdown>{relatorioDetalhe.body}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">Não foi possível carregar o conteúdo.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
