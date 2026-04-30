import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  buscarAdminSources, criarSource, atualizarSource, excluirSource, adminKeys,
} from '../../services/admin'
import type { AdminSource, CategoriaSource, TierSource } from '../../types/admin'

const CATEGORIAS: CategoriaSource[] = ['geopolitica', 'economia', 'defesa', 'mercados']
const TIERS: TierSource[] = ['A', 'B']

const TIER_DESCRICAO: Record<TierSource, string> = {
  A: 'A — horária',
  B: 'B — 2× por dia',
}

const CATEGORIA_CORES: Record<CategoriaSource, string> = {
  geopolitica: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  economia:    'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  defesa:      'border-red-500/40 bg-red-500/10 text-red-300',
  mercados:    'border-amber-500/40 bg-amber-500/10 text-amber-300',
}

interface FormState {
  nome: string
  rss_url: string
  categoria: CategoriaSource
  tier: TierSource
  ativo: boolean
}

const FORM_VAZIO: FormState = { nome: '', rss_url: '', categoria: 'geopolitica', tier: 'A', ativo: true }

interface ModalState {
  aberto: boolean
  source?: AdminSource
}

function BadgeCategoria({ categoria }: { categoria: CategoriaSource }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] ${CATEGORIA_CORES[categoria]}`}>
      {categoria}
    </span>
  )
}

function BadgeTier({ tier }: { tier: TierSource }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${
      tier === 'A'
        ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
        : 'border-sky-500/40 bg-sky-500/10 text-sky-300'
    }`}>
      Tier {tier}
    </span>
  )
}

function BadgeAtivo({ ativo }: { ativo: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.12em] ${
      ativo
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
        : 'border-zinc-600/40 bg-zinc-800/50 text-zinc-500'
    }`}>
      {ativo ? 'Ativa' : 'Inativa'}
    </span>
  )
}

export function AdminFontes() {
  const queryClient = useQueryClient()
  const prefersReduced = useReducedMotion()

  const [modal, setModal] = useState<ModalState>({ aberto: false })
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [erro, setErro] = useState<string | null>(null)

  const { data: sources = [], isLoading } = useQuery({
    queryKey: adminKeys.sources(),
    queryFn: buscarAdminSources,
  })

  const mutacaoCriar = useMutation({
    mutationFn: criarSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.sources() })
      fecharModal()
    },
    onError: (e: any) => setErro(e?.response?.data?.message ?? 'Erro ao salvar fonte.'),
  })

  const mutacaoAtualizar = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<FormState> }) =>
      atualizarSource(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.sources() })
      fecharModal()
    },
    onError: (e: any) => setErro(e?.response?.data?.message ?? 'Erro ao salvar fonte.'),
  })

  const mutacaoDeletar = useMutation({
    mutationFn: excluirSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.sources() }),
  })

  const mutacaoToggle = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      atualizarSource(id, { ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.sources() }),
  })

  function abrirModalCriacao() {
    setForm(FORM_VAZIO)
    setErro(null)
    setModal({ aberto: true, source: undefined })
  }

  function abrirModalEdicao(source: AdminSource) {
    setForm({ nome: source.nome, rss_url: source.rss_url, categoria: source.categoria, tier: source.tier ?? 'A', ativo: source.ativo })
    setErro(null)
    setModal({ aberto: true, source })
  }

  function fecharModal() {
    setModal({ aberto: false })
    setErro(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (modal.source) {
      mutacaoAtualizar.mutate({ id: modal.source.id, payload: form })
    } else {
      mutacaoCriar.mutate(form)
    }
  }

  function handleDeletar(source: AdminSource) {
    if (!window.confirm(`Excluir a fonte "${source.nome}"? Esta ação não pode ser desfeita.`)) return
    mutacaoDeletar.mutate(source.id)
  }

  const isPending = mutacaoCriar.isPending || mutacaoAtualizar.isPending

  const ativas = sources.filter((s) => s.ativo).length
  const inativas = sources.length - ativas

  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#C9B882]/60">Painel admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Fontes RSS</h1>
            <p className="text-sm text-zinc-400">
              Gerencie as fontes de notícias coletadas pelo pipeline de IA.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">{ativas} ativas · {inativas} inativas</span>
            <button
              type="button"
              onClick={abrirModalCriacao}
              className="inline-flex items-center gap-2 rounded-lg border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20"
            >
              + Nova Fonte
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-xl border border-zinc-800 bg-[#0d0d0f] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
              Carregando fontes...
            </div>
          ) : sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-zinc-400">Nenhuma fonte cadastrada.</p>
              <button type="button" onClick={abrirModalCriacao}
                className="font-mono text-xs text-[#C9B882] hover:underline">
                Adicionar primeira fonte
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Nome</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Categoria</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Tier</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Status</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Última coleta</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-200">{source.nome}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-600 truncate max-w-[280px]" title={source.rss_url}>
                          {source.rss_url}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <BadgeCategoria categoria={source.categoria} />
                      </td>
                      <td className="px-4 py-3">
                        <BadgeTier tier={source.tier ?? 'A'} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => mutacaoToggle.mutate({ id: source.id, ativo: !source.ativo })}
                          title={source.ativo ? 'Clique para desativar' : 'Clique para ativar'}
                        >
                          <BadgeAtivo ativo={source.ativo} />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {source.ultima_coleta_em
                          ? new Date(source.ultima_coleta_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => abrirModalEdicao(source)}
                            className="rounded px-2 py-1 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
                            Editar
                          </button>
                          <button type="button" onClick={() => handleDeletar(source)}
                            disabled={mutacaoDeletar.isPending}
                            className="rounded px-2 py-1 font-mono text-xs text-red-500/60 transition-colors hover:bg-red-500/10 hover:text-red-400">
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal.aberto && (
          <>
            <motion.div key="overlay"
              className="fixed inset-0 z-40 bg-black/60"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              onClick={fecharModal} aria-hidden="true" />

            <motion.div key="content"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={prefersReduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: prefersReduced ? 0 : 0.18, ease: 'easeOut' }}>
              <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#111318] p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-zinc-100">
                    {modal.source ? 'Editar Fonte RSS' : 'Nova Fonte RSS'}
                  </h2>
                  <button type="button" onClick={fecharModal} aria-label="Fechar"
                    className="text-zinc-500 transition-colors hover:text-zinc-200">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">Nome</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      required
                      placeholder="Reuters World News"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#C9B882]/60 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">URL do RSS</label>
                    <input
                      type="url"
                      value={form.rss_url}
                      onChange={(e) => setForm((f) => ({ ...f, rss_url: e.target.value }))}
                      required
                      placeholder="https://feeds.reuters.com/reuters/worldNews"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#C9B882]/60 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">Categoria</label>
                      <select
                        value={form.categoria}
                        onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as CategoriaSource }))}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-[#C9B882]/60 focus:outline-none"
                      >
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">Tier de coleta</label>
                      <select
                        value={form.tier}
                        onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as TierSource }))}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-[#C9B882]/60 focus:outline-none"
                      >
                        {TIERS.map((t) => (
                          <option key={t} value={t}>{TIER_DESCRICAO[t]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={form.ativo}
                      onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                      className="h-4 w-4 rounded border-zinc-600 accent-[#C9B882]"
                    />
                    <label htmlFor="ativo" className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-400 cursor-pointer">
                      Fonte ativa (coletada pelo pipeline)
                    </label>
                  </div>

                  {erro && (
                    <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">
                      {erro}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={fecharModal}
                      className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-zinc-200">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isPending}
                      className="rounded-lg border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20 disabled:opacity-50">
                      {isPending ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
