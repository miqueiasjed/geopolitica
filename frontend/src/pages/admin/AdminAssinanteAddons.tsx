import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Cross2Icon, Pencil1Icon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'
import {
  adminAssinanteAddons,
  adminAssinanteAddonsKeys,
} from '../../services/adminAssinanteAddons'
import { adminProdutos, adminProdutosKeys } from '../../services/adminProdutos'
import type { AssinanteAddon, StatusAddonUsuario, AdicionarAddonPayload } from '../../types/produto'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(valor: string | null): string {
  if (!valor) return '—'
  const [ano, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type TipoToast = 'sucesso' | 'erro'

interface ToastState {
  tipo: TipoToast
  mensagem: string
}

function Toast({ toast, onFechar }: { toast: ToastState; onFechar: () => void }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      key="toast"
      initial={prefersReduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: prefersReduced ? 0 : 0.2 }}
      className={`fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl ${
        toast.tipo === 'sucesso'
          ? 'border-green-500/20 bg-green-500/10 text-green-400'
          : 'border-red-500/20 bg-red-500/10 text-red-400'
      }`}
    >
      <span className="font-mono text-sm">{toast.mensagem}</span>
      <button type="button" onClick={onFechar} className="ml-2 text-current opacity-60 hover:opacity-100">
        <Cross2Icon className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Badge de status ──────────────────────────────────────────────────────────

function BadgeStatus({ status }: { status: StatusAddonUsuario }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700/30 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
        —
      </span>
    )
  }

  const estilos: Record<Exclude<StatusAddonUsuario, null>, string> = {
    ativo:       'bg-green-500/10 text-green-400',
    cancelado:   'bg-amber-500/10 text-amber-400',
    expirado:    'bg-zinc-700/30 text-zinc-500',
    reembolsado: 'bg-red-500/10 text-red-400',
  }

  const labels: Record<Exclude<StatusAddonUsuario, null>, string> = {
    ativo:       'Ativo',
    cancelado:   'Cancelado',
    expirado:    'Expirado',
    reembolsado: 'Reembolsado',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${estilos[status]}`}>
      {labels[status]}
    </span>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonLinha() {
  return (
    <tr className="border-b border-[#1e1e20]">
      {[140, 100, 90, 90, 120].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-zinc-800" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Modal Editar Status ──────────────────────────────────────────────────────

interface ModalEditarProps {
  addon: AssinanteAddon
  userId: number
  onFechar: () => void
  onSucesso: () => void
  onErro: () => void
}

function ModalEditarStatus({ addon, userId, onFechar, onSucesso, onErro }: ModalEditarProps) {
  const prefersReduced = useReducedMotion()
  const queryClient = useQueryClient()
  const [statusSelecionado, setStatusSelecionado] = useState<Exclude<StatusAddonUsuario, null>>(
    addon.status ?? 'ativo',
  )

  const mutacao = useMutation({
    mutationFn: () =>
      adminAssinanteAddons.atualizar(userId, addon.id, { status: statusSelecionado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAssinanteAddonsKeys.porUsuario(userId) })
      onSucesso()
      onFechar()
    },
    onError: () => {
      onErro()
    },
  })

  return (
    <>
      <motion.div
        key="overlay-editar"
        className="fixed inset-0 z-40 bg-black/60"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.2 }}
        onClick={onFechar}
        aria-hidden="true"
      />

      <motion.div
        key="content-editar"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeOut' }}
      >
        <div className="w-full max-w-sm rounded-xl border border-[#2a2a2e] bg-[#111113] p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Editar Status do Addon</h2>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Addon
          </div>
          <p className="mb-4 font-mono text-sm text-zinc-300">{addon.chave}</p>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Status
            </label>
            <select
              value={statusSelecionado}
              onChange={(e) => setStatusSelecionado(e.target.value as Exclude<StatusAddonUsuario, null>)}
              className="rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20"
            >
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="expirado">Expirado</option>
              <option value="reembolsado">Reembolsado</option>
            </select>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg px-4 py-2 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => mutacao.mutate()}
              disabled={mutacao.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutacao.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Modal Confirmar Remoção ──────────────────────────────────────────────────

interface ModalRemoverProps {
  addon: AssinanteAddon
  userId: number
  onFechar: () => void
  onSucesso: () => void
  onErro: () => void
}

function ModalRemover({ addon, userId, onFechar, onSucesso, onErro }: ModalRemoverProps) {
  const prefersReduced = useReducedMotion()
  const queryClient = useQueryClient()

  const mutacao = useMutation({
    mutationFn: () => adminAssinanteAddons.remover(userId, addon.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAssinanteAddonsKeys.porUsuario(userId) })
      onSucesso()
      onFechar()
    },
    onError: () => {
      onErro()
    },
  })

  return (
    <>
      <motion.div
        key="overlay-remover"
        className="fixed inset-0 z-40 bg-black/60"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.2 }}
        onClick={onFechar}
        aria-hidden="true"
      />

      <motion.div
        key="content-remover"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeOut' }}
      >
        <div className="w-full max-w-sm rounded-xl border border-[#2a2a2e] bg-[#111113] p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Remover Addon</h2>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-1 text-sm text-zinc-400">
            Tem certeza que deseja remover o addon{' '}
            <span className="font-mono text-zinc-200">{addon.chave}</span>?
          </p>
          <p className="mb-5 text-xs text-zinc-600">Esta ação não pode ser desfeita.</p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg px-4 py-2 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => mutacao.mutate()}
              disabled={mutacao.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutacao.isPending ? 'Removendo…' : 'Remover'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Modal Adicionar Addon ────────────────────────────────────────────────────

interface ModalAdicionarProps {
  userId: number
  onFechar: () => void
  onSucesso: () => void
  onErro: () => void
}

function ModalAdicionarAddon({ userId, onFechar, onSucesso, onErro }: ModalAdicionarProps) {
  const prefersReduced = useReducedMotion()
  const queryClient = useQueryClient()

  const [produtoChave, setProdutoChave] = useState('')
  const [status, setStatus] = useState<Exclude<StatusAddonUsuario, null>>('ativo')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const produtosQuery = useQuery({
    queryKey: adminProdutosKeys.lista(),
    queryFn: adminProdutos.listar,
  })

  const produtosAtivos = (produtosQuery.data ?? []).filter((p) => p.ativo)

  const mutacao = useMutation({
    mutationFn: () => {
      const payload: AdicionarAddonPayload = {
        produto_chave: produtoChave,
        status,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
      }
      return adminAssinanteAddons.adicionar(userId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAssinanteAddonsKeys.porUsuario(userId) })
      onSucesso()
      onFechar()
    },
    onError: () => {
      onErro()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!produtoChave) return
    mutacao.mutate()
  }

  return (
    <>
      <motion.div
        key="overlay-adicionar"
        className="fixed inset-0 z-40 bg-black/60"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.2 }}
        onClick={onFechar}
        aria-hidden="true"
      />

      <motion.div
        key="content-adicionar"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={prefersReduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeOut' }}
      >
        <div className="w-full max-w-md rounded-xl border border-[#2a2a2e] bg-[#111113] p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Adicionar Addon</h2>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Produto
              </label>
              <select
                value={produtoChave}
                onChange={(e) => setProdutoChave(e.target.value)}
                required
                disabled={produtosQuery.isLoading}
                className="rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 placeholder:text-zinc-600"
              >
                <option value="">
                  {produtosQuery.isLoading ? 'Carregando…' : 'Selecionar produto'}
                </option>
                {produtosAtivos.map((p) => (
                  <option key={p.chave} value={p.chave}>
                    {p.nome} ({p.chave})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Exclude<StatusAddonUsuario, null>)}
                className="rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20"
              >
                <option value="ativo">Ativo</option>
                <option value="cancelado">Cancelado</option>
                <option value="expirado">Expirado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Início (opcional)
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Fim (opcional)
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onFechar}
                className="rounded-lg px-4 py-2 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!produtoChave || mutacao.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mutacao.isPending ? 'Adicionando…' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

type ModalAtivo =
  | { tipo: 'adicionar' }
  | { tipo: 'editar'; addon: AssinanteAddon }
  | { tipo: 'remover'; addon: AssinanteAddon }
  | null

export function AdminAssinanteAddons({ userId }: { userId: number }) {
  const prefersReduced = useReducedMotion()
  const [modalAtivo, setModalAtivo] = useState<ModalAtivo>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const { data: addons = [], isLoading } = useQuery({
    queryKey: adminAssinanteAddonsKeys.porUsuario(userId),
    queryFn: () => adminAssinanteAddons.listar(userId),
  })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function mostrarToast(tipo: TipoToast, mensagem: string) {
    setToast({ tipo, mensagem })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Addons do Assinante
        </p>
        <button
          type="button"
          onClick={() => setModalAtivo({ tipo: 'adicionar' })}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="h-3 w-3" />
          Adicionar Addon
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-[#1e1e20] bg-[#0d0d0f]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-[#080809]">
              <tr className="border-b border-[#1e1e20]">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Addon
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Início
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Fim
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <SkeletonLinha />
                  <SkeletonLinha />
                  <SkeletonLinha />
                </>
              ) : addons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center font-mono text-sm text-zinc-600">
                    Nenhum addon cadastrado
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {addons.map((addon, i) => (
                    <motion.tr
                      key={addon.id}
                      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: prefersReduced ? 0 : 0.3, delay: i * 0.04 }}
                      className={`border-b border-[#1e1e20] transition-colors hover:bg-zinc-800/10 ${
                        i % 2 === 0 ? 'bg-[#0d0d0f]' : 'bg-[#0a0a0b]'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-sm text-zinc-200">
                        {addon.chave}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeStatus status={addon.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {formatarData(addon.data_inicio)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {formatarData(addon.data_fim)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setModalAtivo({ tipo: 'editar', addon })}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                          >
                            <Pencil1Icon className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalAtivo({ tipo: 'remover', addon })}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-red-500/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <TrashIcon className="h-3 w-3" />
                            Remover
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      <AnimatePresence>
        {modalAtivo?.tipo === 'adicionar' && (
          <ModalAdicionarAddon
            key="modal-adicionar"
            userId={userId}
            onFechar={() => setModalAtivo(null)}
            onSucesso={() => mostrarToast('sucesso', 'Addon adicionado com sucesso.')}
            onErro={() => mostrarToast('erro', 'Erro ao adicionar addon.')}
          />
        )}
        {modalAtivo?.tipo === 'editar' && (
          <ModalEditarStatus
            key="modal-editar"
            addon={modalAtivo.addon}
            userId={userId}
            onFechar={() => setModalAtivo(null)}
            onSucesso={() => mostrarToast('sucesso', 'Status atualizado com sucesso.')}
            onErro={() => mostrarToast('erro', 'Erro ao atualizar status.')}
          />
        )}
        {modalAtivo?.tipo === 'remover' && (
          <ModalRemover
            key="modal-remover"
            addon={modalAtivo.addon}
            userId={userId}
            onFechar={() => setModalAtivo(null)}
            onSucesso={() => mostrarToast('sucesso', 'Addon removido com sucesso.')}
            onErro={() => mostrarToast('erro', 'Erro ao remover addon.')}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast key="toast" toast={toast} onFechar={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
