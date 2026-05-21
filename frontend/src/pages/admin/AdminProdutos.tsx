import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Cross2Icon,
  ExternalLinkIcon,
  Link2Icon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { adminProdutos, adminProdutosKeys } from '../../services/adminProdutos'
import type { AdminProduto, CriarProdutoPayload, AtualizarProdutoPayload } from '../../types/produto'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CAMPO =
  'rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 placeholder:text-zinc-600'

const REGEX_CHAVE = /^[a-z0-9_-]+$/

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastTipo = 'sucesso' | 'erro'

interface ToastMsg {
  id: number
  tipo: ToastTipo
  mensagem: string
}

let _toastId = 0

function Toast({ toast, onRemover }: { toast: ToastMsg; onRemover: () => void }) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const t = setTimeout(onRemover, 3500)
    return () => clearTimeout(t)
  }, [onRemover])

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 font-mono text-[13px] shadow-xl ${
        toast.tipo === 'sucesso'
          ? 'border-green-500/25 bg-green-500/10 text-green-300'
          : 'border-red-500/25 bg-red-500/10 text-red-300'
      }`}
    >
      <span className="flex-1">{toast.mensagem}</span>
      <button
        type="button"
        onClick={onRemover}
        className="ml-2 text-zinc-500 hover:text-zinc-200"
        aria-label="Fechar notificação"
      >
        <Cross2Icon className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Modal Produto (Criar / Editar) ───────────────────────────────────────────

interface ErrosCampos {
  chave?: string
  nome?: string
  link_compra?: string
  link_reativar?: string
  [key: string]: string | undefined
}

interface ModalProdutoProps {
  produto: AdminProduto | null
  onFechar: () => void
  onSucesso: (msg: string) => void
}

function ModalProduto({ produto, onFechar, onSucesso }: ModalProdutoProps) {
  const queryClient = useQueryClient()
  const reduced = useReducedMotion()
  const editando = produto !== null

  const [form, setFormState] = useState({
    chave:        produto?.chave ?? '',
    nome:         produto?.nome ?? '',
    descricao:    produto?.descricao ?? '',
    preco_label:  produto?.preco_label ?? '',
    link_compra:  produto?.link_compra ?? '',
    link_reativar: produto?.link_reativar ?? '',
    ativo:        produto?.ativo ?? true,
    ordem:        produto?.ordem ?? 0,
    recurso_plano: produto?.recurso_plano ?? '',
    product_id_lastlink: produto?.product_id_lastlink ?? '',
    product_id_hotmart:  produto?.product_id_hotmart ?? '',
  })
  const [erros, setErros] = useState<ErrosCampos>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  function set(campo: string, valor: string | boolean | number) {
    setFormState(prev => ({ ...prev, [campo]: valor }))
    setErros(prev => ({ ...prev, [campo]: undefined }))
    setErroGeral(null)
  }

  function validar(): boolean {
    const novosErros: ErrosCampos = {}

    if (!editando) {
      if (!form.chave.trim()) {
        novosErros.chave = 'Campo obrigatório.'
      } else if (!REGEX_CHAVE.test(form.chave.trim())) {
        novosErros.chave = 'Apenas letras minúsculas, números, - e _.'
      }
    }

    if (!form.nome.trim()) {
      novosErros.nome = 'Campo obrigatório.'
    }

    if (form.link_compra.trim() && !/^https?:\/\/.+/.test(form.link_compra.trim())) {
      novosErros.link_compra = 'URL inválida.'
    }

    if (form.link_reativar.trim() && !/^https?:\/\/.+/.test(form.link_reativar.trim())) {
      novosErros.link_reativar = 'URL inválida.'
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (editando) {
        const payload: AtualizarProdutoPayload = {
          nome:                form.nome.trim(),
          descricao:           form.descricao.trim() || null,
          preco_label:         form.preco_label.trim() || null,
          link_compra:         form.link_compra.trim() || null,
          link_reativar:       form.link_reativar.trim() || null,
          ativo:               form.ativo,
          ordem:               Number(form.ordem),
          recurso_plano:       form.recurso_plano.trim() || null,
          product_id_lastlink: form.product_id_lastlink.trim() || null,
          product_id_hotmart:  form.product_id_hotmart.trim() || null,
        }
        return adminProdutos.atualizar(produto.id, payload)
      }

      const payload: CriarProdutoPayload = {
        chave:               form.chave.trim(),
        nome:                form.nome.trim(),
        descricao:           form.descricao.trim() || null,
        preco_label:         form.preco_label.trim() || null,
        link_compra:         form.link_compra.trim() || null,
        link_reativar:       form.link_reativar.trim() || null,
        ativo:               form.ativo,
        ordem:               Number(form.ordem),
        recurso_plano:       form.recurso_plano.trim() || null,
        product_id_lastlink: form.product_id_lastlink.trim() || null,
        product_id_hotmart:  form.product_id_hotmart.trim() || null,
      }
      return adminProdutos.criar(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProdutosKeys.lista() })
      onSucesso(editando ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }
      if (err.response?.status === 422) {
        const errosBackend = err.response.data?.errors ?? {}
        const mapeados: ErrosCampos = {}
        for (const [campo, msgs] of Object.entries(errosBackend)) {
          mapeados[campo] = Array.isArray(msgs) ? msgs[0] : String(msgs)
        }
        if (Object.keys(mapeados).length > 0) {
          setErros(mapeados)
        } else {
          setErroGeral(err.response.data?.message ?? 'Erro de validação.')
        }
      } else {
        setErroGeral(
          err.response?.data?.message ?? 'Erro ao salvar. Tente novamente.',
        )
      }
    },
  })

  function handleSubmit() {
    if (!validar()) return
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-lg rounded-2xl border border-[#2a2a2e] bg-[#0d0d0f] shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e20] px-6 py-4 flex-shrink-0">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C9B882]/70">admin</p>
            <h2 className="text-base font-semibold text-white">
              {editando ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            aria-label="Fechar modal"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Chave */}
          <div className="space-y-1.5">
            <label
              htmlFor="produto-chave"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
            >
              Chave *
            </label>
            <input
              id="produto-chave"
              type="text"
              value={form.chave}
              onChange={e => set('chave', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              readOnly={editando}
              placeholder="ex: sinais_pro"
              className={`${CAMPO} ${editando ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-describedby={erros.chave ? 'produto-chave-erro' : 'produto-chave-hint'}
            />
            {erros.chave ? (
              <p id="produto-chave-erro" className="font-mono text-[11px] text-red-400">{erros.chave}</p>
            ) : (
              <p id="produto-chave-hint" className="font-mono text-[10px] text-zinc-600">
                {editando ? 'Imutável após criação.' : 'Minúsculas, números, - e _.'}
              </p>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label
              htmlFor="produto-nome"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
            >
              Nome *
            </label>
            <input
              id="produto-nome"
              type="text"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="ex: Sinais Pro"
              className={CAMPO}
            />
            {erros.nome && (
              <p className="font-mono text-[11px] text-red-400">{erros.nome}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label
              htmlFor="produto-descricao"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
            >
              Descrição
            </label>
            <textarea
              id="produto-descricao"
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              rows={2}
              placeholder="Opcional"
              className={`${CAMPO} resize-none`}
            />
          </div>

          {/* Preço label */}
          <div className="space-y-1.5">
            <label
              htmlFor="produto-preco-label"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
            >
              Preço (label)
            </label>
            <input
              id="produto-preco-label"
              type="text"
              value={form.preco_label}
              onChange={e => set('preco_label', e.target.value)}
              placeholder="ex: R$ 49/mês"
              className={CAMPO}
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="produto-link-compra"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
              >
                Link de Compra
              </label>
              <input
                id="produto-link-compra"
                type="url"
                value={form.link_compra}
                onChange={e => set('link_compra', e.target.value)}
                placeholder="https://..."
                className={CAMPO}
              />
              {erros.link_compra && (
                <p className="font-mono text-[11px] text-red-400">{erros.link_compra}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="produto-link-reativar"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
              >
                Link de Reativação
              </label>
              <input
                id="produto-link-reativar"
                type="url"
                value={form.link_reativar}
                onChange={e => set('link_reativar', e.target.value)}
                placeholder="https://..."
                className={CAMPO}
              />
              {erros.link_reativar && (
                <p className="font-mono text-[11px] text-red-400">{erros.link_reativar}</p>
              )}
            </div>
          </div>

          {/* Recurso do Plano */}
          <div className="space-y-1.5">
            <label
              htmlFor="produto-recurso-plano"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
            >
              Recurso do Plano
            </label>
            <input
              id="produto-recurso-plano"
              type="text"
              value={form.recurso_plano}
              onChange={e => set('recurso_plano', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="ex: monitor_eleitoral"
              className={CAMPO}
            />
            <p className="font-mono text-[10px] text-zinc-600">
              Chave de <code className="text-zinc-500">plano_recursos</code> que libera este addon pelo plano. Deixe vazio se for avulso apenas.
            </p>
          </div>

          {/* IDs de Pagamento */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="produto-lastlink-id"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
              >
                ID Lastlink
              </label>
              <input
                id="produto-lastlink-id"
                type="text"
                value={form.product_id_lastlink}
                onChange={e => set('product_id_lastlink', e.target.value)}
                placeholder="ex: 98765"
                className={CAMPO}
              />
              {erros.product_id_lastlink && (
                <p className="font-mono text-[11px] text-red-400">{erros.product_id_lastlink}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="produto-hotmart-id"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
              >
                ID Hotmart
              </label>
              <input
                id="produto-hotmart-id"
                type="text"
                value={form.product_id_hotmart}
                onChange={e => set('product_id_hotmart', e.target.value)}
                placeholder="ex: 12345"
                className={CAMPO}
              />
              {erros.product_id_hotmart && (
                <p className="font-mono text-[11px] text-red-400">{erros.product_id_hotmart}</p>
              )}
            </div>
          </div>

          {/* Ordem + Ativo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="produto-ordem"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
              >
                Ordem
              </label>
              <input
                id="produto-ordem"
                type="number"
                value={form.ordem}
                onChange={e => set('ordem', parseInt(e.target.value) || 0)}
                min={0}
                className={CAMPO}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="produto-ativo"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500"
              >
                Status
              </label>
              <label
                htmlFor="produto-ativo"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 h-[38px]"
              >
                <input
                  id="produto-ativo"
                  type="checkbox"
                  checked={form.ativo}
                  onChange={e => set('ativo', e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#C9B882]"
                />
                <span className="font-mono text-sm text-zinc-300">Produto ativo</span>
              </label>
            </div>
          </div>

          {erroGeral && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">
              {erroGeral}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#1e1e20] px-6 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border border-zinc-700/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <>
                <svg
                  className="h-3 w-3 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Salvando…
              </>
            ) : editando ? (
              'Salvar alterações'
            ) : (
              <>
                <PlusIcon className="h-3 w-3" />
                Criar Produto
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Dialog de confirmação de exclusão ────────────────────────────────────────

interface DialogExcluirProps {
  produto: AdminProduto
  onCancelar: () => void
  onConfirmar: () => void
  pending: boolean
}

function DialogExcluir({ produto, onCancelar, onConfirmar, pending }: DialogExcluirProps) {
  const reduced = useReducedMotion()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl border border-[#2a2a2e] bg-[#0d0d0f] shadow-2xl"
      >
        <div className="px-6 py-5 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-red-400/70">Confirmar exclusão</p>
          <p className="text-sm text-zinc-200 leading-relaxed">
            Excluir o produto{' '}
            <span className="font-mono text-[#C9B882]">{produto.nome}</span>?
            Esta ação não pode ser desfeita.
          </p>
          <p className="font-mono text-[11px] text-zinc-600">chave: {produto.chave}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#1e1e20] px-6 py-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={pending}
            className="rounded-full border border-zinc-700/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? (
              <>
                <svg
                  className="h-3 w-3 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Excluindo…
              </>
            ) : (
              <>
                <TrashIcon className="h-3 w-3" />
                Excluir
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Célula de link ───────────────────────────────────────────────────────────

function CelulaLink({ url, titulo }: { url: string | null; titulo: string }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={url}
        className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
        aria-label={`${titulo}: ${url}`}
      >
        <ExternalLinkIcon className="h-3.5 w-3.5" />
      </a>
    )
  }

  return (
    <span title="Sem link" className="text-zinc-700" aria-label={`${titulo}: sem link`}>
      <Link2Icon className="h-3.5 w-3.5" />
    </span>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AdminProdutos() {
  const queryClient = useQueryClient()
  const reduced = useReducedMotion()

  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<AdminProduto | null>(null)
  const [produtoExcluindo, setProdutoExcluindo] = useState<AdminProduto | null>(null)

  const { data: produtos, isLoading, isError } = useQuery({
    queryKey: adminProdutosKeys.lista(),
    queryFn: adminProdutos.listar,
    staleTime: 30_000,
  })

  const produtosOrdenados = produtos ? [...produtos].sort((a, b) => a.ordem - b.ordem) : []

  function adicionarToast(tipo: ToastTipo, mensagem: string) {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, tipo, mensagem }])
  }

  function removerToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const mutacaoExcluir = useMutation({
    mutationFn: (id: number) => adminProdutos.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminProdutosKeys.lista() })
      setProdutoExcluindo(null)
      adicionarToast('sucesso', 'Produto excluído com sucesso.')
    },
    onError: (e: unknown) => {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      const mensagem =
        err.response?.status === 422
          ? (err.response.data?.message ?? 'Não é possível excluir este produto.')
          : 'Erro ao excluir. Tente novamente.'
      setProdutoExcluindo(null)
      adicionarToast('erro', mensagem)
    },
  })

  function abrirCriar() {
    setProdutoEditando(null)
    setModalAberto(true)
  }

  function abrirEditar(produto: AdminProduto) {
    setProdutoEditando(produto)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setProdutoEditando(null)
  }

  function handleSucesso(msg: string) {
    fecharModal()
    adicionarToast('sucesso', msg)
  }

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-80">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} toast={t} onRemover={() => removerToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">admin</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Addons</h1>
          <p className="text-sm text-zinc-400">
            Gerencie os addons disponíveis para os assinantes.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirCriar}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Novo Produto
        </button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Erro */}
      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
          Não foi possível carregar os produtos. Verifique a conexão e tente novamente.
        </div>
      )}

      {/* Tabela */}
      {!isLoading && !isError && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
          className="overflow-x-auto rounded-xl border border-[#1e1e20]"
        >
          <table className="min-w-[700px] w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e20] bg-[#080809]">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Nome</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Chave</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Preço</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Links</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Ordem</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosOrdenados.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center font-mono text-sm text-zinc-600"
                  >
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                produtosOrdenados.map((produto, idx) => (
                  <tr
                    key={produto.id}
                    className={`border-b border-[#111113] transition-colors hover:bg-[#111115] ${
                      idx % 2 === 0 ? 'bg-[#0d0d0f]' : 'bg-[#0a0a0b]'
                    }`}
                  >
                    {/* Nome */}
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-zinc-200">{produto.nome}</p>
                      {produto.descricao && (
                        <p className="font-mono text-[10px] text-zinc-600 mt-0.5 max-w-[180px] truncate" title={produto.descricao}>
                          {produto.descricao}
                        </p>
                      )}
                    </td>

                    {/* Chave */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block rounded bg-zinc-800/60 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">
                        {produto.chave}
                      </span>
                    </td>

                    {/* Preço */}
                    <td className="px-4 py-3.5">
                      {produto.preco_label ? (
                        <span className="font-mono text-sm text-zinc-200">{produto.preco_label}</span>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-700">—</span>
                      )}
                    </td>

                    {/* Links */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] text-zinc-600">compra</span>
                          <CelulaLink url={produto.link_compra} titulo="Link de compra" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[10px] text-zinc-600">reativar</span>
                          <CelulaLink url={produto.link_reativar} titulo="Link de reativação" />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {produto.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[10px] text-green-400">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-700/30 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                          Inativo
                        </span>
                      )}
                    </td>

                    {/* Ordem */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm text-zinc-400">{produto.ordem}</span>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirEditar(produto)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9B882]/25 bg-[#C9B882]/5 px-2.5 py-1.5 font-mono text-[11px] text-[#C9B882] hover:bg-[#C9B882]/12 transition-colors"
                        >
                          <Pencil1Icon className="h-3 w-3" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdutoExcluindo(produto)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 font-mono text-[11px] text-red-400 hover:bg-red-500/15 transition-colors"
                        >
                          <TrashIcon className="h-3 w-3" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Modal Criar / Editar */}
      <AnimatePresence>
        {modalAberto && (
          <ModalProduto
            key="modal-produto"
            produto={produtoEditando}
            onFechar={fecharModal}
            onSucesso={handleSucesso}
          />
        )}
      </AnimatePresence>

      {/* Dialog Excluir */}
      <AnimatePresence>
        {produtoExcluindo && (
          <DialogExcluir
            key="dialog-excluir"
            produto={produtoExcluindo}
            onCancelar={() => setProdutoExcluindo(null)}
            onConfirmar={() => mutacaoExcluir.mutate(produtoExcluindo.id)}
            pending={mutacaoExcluir.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
