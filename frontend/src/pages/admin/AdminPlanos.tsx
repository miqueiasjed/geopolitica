import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircledIcon, Cross2Icon, Pencil1Icon, PlusIcon, Link2Icon } from '@radix-ui/react-icons'
import {
  fetchPlanos,
  atualizarRecurso,
  criarPlano,
  adminPlanosKeys,
} from '../../services/adminPlanos'
import type { Plano, PlanoRecursoItem } from '../../services/adminPlanos'

// ─── Labels humanizados dos recursos ─────────────────────────────────────────

const LABELS: Record<string, string> = {
  chat_diario_limite: 'Chat (por dia)',
  relatorio_mensal_limite: 'Relatórios IA (por mês)',
  feed_historico_dias: 'Histórico do Feed (dias)',
  feed_paginacao_limite: 'Feed — Itens por Página',
  conteudo_historico_dias: 'Conteúdo (histórico dias)',
  paises_seguidos_limite: 'Países Seguidos (limite)',
  biblioteca_acesso: 'Acesso à Biblioteca',
  monitor_eleitoral: 'Monitor Eleitoral',
  monitor_guerra: 'Monitor de Guerra',
  risk_score: 'Risk Score de Portfólio',
  alertas_nivel: 'Nível de Alertas',
}

// ─── Tipos de recurso inferidos pela chave ────────────────────────────────────

type TipoRecurso = 'boolean' | 'numero' | 'alertas_nivel'

function inferirTipo(chave: string): TipoRecurso {
  if (
    chave.includes('acesso') ||
    chave.includes('monitor') ||
    chave.includes('risk_score') ||
    chave.includes('biblioteca')
  ) {
    return 'boolean'
  }
  if (chave.includes('_limite') || chave.includes('_dias')) {
    return 'numero'
  }
  if (chave === 'alertas_nivel') {
    return 'alertas_nivel'
  }
  return 'boolean'
}

// ─── Badge de valor ───────────────────────────────────────────────────────────

interface BadgeValorProps {
  valor: PlanoRecursoItem
  chave: string
}

function BadgeValor({ valor, chave }: BadgeValorProps) {
  if (valor === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-green-400">
        Ilimitado
      </span>
    )
  }

  if (valor === 'false') {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700/50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
        Desativado
      </span>
    )
  }

  if (valor === 'true') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-green-400">
        <CheckCircledIcon className="h-3 w-3" />
        Ativo
      </span>
    )
  }

  if (chave.includes('_dias')) {
    return (
      <span className="font-mono text-sm font-semibold text-zinc-200">
        {valor} <span className="text-xs text-zinc-500">dias</span>
      </span>
    )
  }

  if (chave.includes('_limite')) {
    return (
      <span className="font-mono text-sm font-semibold text-zinc-200">
        {valor} <span className="text-xs text-zinc-500">/dia</span>
      </span>
    )
  }

  return (
    <span className="font-mono text-sm text-zinc-200">{valor}</span>
  )
}

// ─── Editor inline de recurso ─────────────────────────────────────────────────

interface EditorRecursoProps {
  planoId: number
  chave: string
  valor: PlanoRecursoItem
  tipo: TipoRecurso
  onConcluir: () => void
}

function EditorRecurso({ planoId, chave, valor, tipo, onConcluir }: EditorRecursoProps) {
  const queryClient = useQueryClient()

  const [valorLocal, setValorLocal] = useState<string>(valor ?? '')
  const [ilimitado, setIlimitado] = useState(valor === null)
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      atualizarRecurso(
        planoId,
        chave,
        tipo === 'boolean' ? (valorLocal === 'true' ? 'true' : 'false') : (ilimitado ? null : valorLocal),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanosKeys.lista() })
      onConcluir()
    },
    onError: () => {
      setErroLocal('Erro ao salvar. Tente novamente.')
    },
  })

  const baseInput =
    'rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-1.5 font-mono text-sm text-zinc-200 outline-none transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20'

  return (
    <div className="space-y-3">
      {tipo === 'boolean' && (
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs text-zinc-400">Valor:</label>
          <select
            value={valorLocal}
            onChange={(e) => setValorLocal(e.target.value)}
            className={`${baseInput} cursor-pointer`}
          >
            <option value="true" className="bg-[#111113]">Ativo (true)</option>
            <option value="false" className="bg-[#111113]">Desativado (false)</option>
          </select>
        </div>
      )}

      {tipo === 'numero' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`ilimitado-${planoId}-${chave}`}
              checked={ilimitado}
              onChange={(e) => {
                setIlimitado(e.target.checked)
                if (e.target.checked) setValorLocal('')
              }}
              className="h-3.5 w-3.5 cursor-pointer accent-[#C9B882]"
            />
            <label
              htmlFor={`ilimitado-${planoId}-${chave}`}
              className="cursor-pointer font-mono text-xs text-zinc-400"
            >
              Ilimitado (null)
            </label>
          </div>
          {!ilimitado && (
            <input
              type="number"
              value={valorLocal}
              onChange={(e) => setValorLocal(e.target.value)}
              min={0}
              className={`${baseInput} w-24`}
              placeholder="0"
            />
          )}
        </div>
      )}

      {tipo === 'alertas_nivel' && (
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs text-zinc-400">Nível:</label>
          <select
            value={valorLocal}
            onChange={(e) => setValorLocal(e.target.value)}
            className={`${baseInput} cursor-pointer`}
          >
            <option value="medium" className="bg-[#111113]">medium</option>
            <option value="medium,high" className="bg-[#111113]">medium,high</option>
            <option value="all" className="bg-[#111113]">all</option>
          </select>
        </div>
      )}

      {erroLocal && (
        <p className="font-mono text-[11px] text-red-400">{erroLocal}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Salvando…
            </>
          ) : (
            <>
              <CheckCircledIcon className="h-3 w-3" />
              Salvar
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onConcluir}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
        >
          <Cross2Icon className="h-3 w-3" />
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Linha de recurso ─────────────────────────────────────────────────────────

interface LinhaRecursoProps {
  planoId: number
  chave: string
  valor: PlanoRecursoItem
}

function LinhaRecurso({ planoId, chave, valor }: LinhaRecursoProps) {
  const [editando, setEditando] = useState(false)
  const tipo = inferirTipo(chave)
  const label = LABELS[chave] ?? chave

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        editando
          ? 'border-[#C9B882]/25 bg-[#C9B882]/5'
          : 'border-[#1e1e20] bg-[#0d0d0f] hover:border-zinc-700/60'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-medium text-zinc-200">{label}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">{chave}</p>
        </div>
        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label={`Editar recurso ${label}`}
            className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-white/5 hover:text-zinc-300"
          >
            <Pencil1Icon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editando ? (
        <EditorRecurso
          planoId={planoId}
          chave={chave}
          valor={valor}
          tipo={tipo}
          onConcluir={() => setEditando(false)}
        />
      ) : (
        <BadgeValor valor={valor} chave={chave} />
      )}
    </div>
  )
}

// ─── Adicionar recurso ───────────────────────────────────────────────────────

interface AdicionarRecursoProps {
  plano: Plano
}

function AdicionarRecurso({ plano }: AdicionarRecursoProps) {
  const queryClient = useQueryClient()
  const [aberto, setAberto] = useState(false)
  const [chaveSelecionada, setChaveSelecionada] = useState('')
  const [valorLocal, setValorLocal] = useState('false')
  const [ilimitado, setIlimitado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const chavesDisponiveis = Object.keys(LABELS).filter(
    (chave) => !(chave in plano.recursos),
  )

  const tipo = chaveSelecionada ? inferirTipo(chaveSelecionada) : 'boolean'

  function abrirForm() {
    const primeira = chavesDisponiveis[0] ?? ''
    setChaveSelecionada(primeira)
    setValorLocal(inferirTipo(primeira) === 'boolean' ? 'false' : '')
    setIlimitado(false)
    setErro(null)
    setAberto(true)
  }

  function trocarChave(chave: string) {
    setChaveSelecionada(chave)
    setValorLocal(inferirTipo(chave) === 'boolean' ? 'false' : '')
    setIlimitado(false)
  }

  const mutation = useMutation({
    mutationFn: () => {
      let valor: string | null
      if (tipo === 'boolean') {
        valor = valorLocal === 'true' ? 'true' : 'false'
      } else if (tipo === 'numero') {
        valor = ilimitado ? null : valorLocal
      } else {
        valor = valorLocal
      }
      return atualizarRecurso(plano.id, chaveSelecionada, valor)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanosKeys.lista() })
      setAberto(false)
    },
    onError: () => setErro('Erro ao salvar. Tente novamente.'),
  })

  if (chavesDisponiveis.length === 0) return null

  const baseInput =
    'rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-1.5 font-mono text-sm text-zinc-200 outline-none transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20'

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={abrirForm}
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-800 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600 transition-colors hover:border-zinc-600 hover:text-zinc-400"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Adicionar recurso
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-[#C9B882]/20 bg-[#C9B882]/5 p-3 space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C9B882]/70">Novo recurso</p>

      {/* Seletor de chave */}
      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">Recurso</label>
        <select
          value={chaveSelecionada}
          onChange={(e) => trocarChave(e.target.value)}
          className={`${baseInput} w-full cursor-pointer`}
        >
          {chavesDisponiveis.map((chave) => (
            <option key={chave} value={chave} className="bg-[#111113]">
              {LABELS[chave]} ({chave})
            </option>
          ))}
        </select>
      </div>

      {/* Editor por tipo */}
      {tipo === 'boolean' && (
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs text-zinc-400">Valor:</label>
          <select
            value={valorLocal}
            onChange={(e) => setValorLocal(e.target.value)}
            className={`${baseInput} cursor-pointer`}
          >
            <option value="true" className="bg-[#111113]">Ativo (true)</option>
            <option value="false" className="bg-[#111113]">Desativado (false)</option>
          </select>
        </div>
      )}

      {tipo === 'numero' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`novo-ilimitado-${plano.id}`}
              checked={ilimitado}
              onChange={(e) => { setIlimitado(e.target.checked); if (e.target.checked) setValorLocal('') }}
              className="h-3.5 w-3.5 cursor-pointer accent-[#C9B882]"
            />
            <label htmlFor={`novo-ilimitado-${plano.id}`} className="cursor-pointer font-mono text-xs text-zinc-400">
              Ilimitado (null)
            </label>
          </div>
          {!ilimitado && (
            <input
              type="number"
              value={valorLocal}
              onChange={(e) => setValorLocal(e.target.value)}
              min={0}
              className={`${baseInput} w-24`}
              placeholder="0"
            />
          )}
        </div>
      )}

      {tipo === 'alertas_nivel' && (
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs text-zinc-400">Nível:</label>
          <select
            value={valorLocal}
            onChange={(e) => setValorLocal(e.target.value)}
            className={`${baseInput} cursor-pointer`}
          >
            <option value="medium" className="bg-[#111113]">medium</option>
            <option value="medium,high" className="bg-[#111113]">medium,high</option>
            <option value="all" className="bg-[#111113]">all</option>
          </select>
        </div>
      )}

      {erro && <p className="font-mono text-[11px] text-red-400">{erro}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={mutation.isPending || !chaveSelecionada}
          onClick={() => mutation.mutate()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Salvando…
            </>
          ) : (
            <><PlusIcon className="h-3 w-3" />Adicionar</>
          )}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
        >
          <Cross2Icon className="h-3 w-3" />
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Card de plano ────────────────────────────────────────────────────────────

const COR_SLUG: Record<string, string> = {
  essencial: 'text-amber-400',
  pro: 'text-cyan-400',
  reservado: 'text-purple-400',
}

const BORDA_SLUG: Record<string, string> = {
  essencial: 'border-amber-500/20',
  pro: 'border-cyan-500/20',
  reservado: 'border-purple-500/20',
}

const HEADER_SLUG: Record<string, string> = {
  essencial: 'bg-amber-500/5',
  pro: 'bg-cyan-500/5',
  reservado: 'bg-purple-500/5',
}

function CardPlano({ plano }: { plano: Plano }) {
  const corSlug = COR_SLUG[plano.slug] ?? 'text-zinc-300'
  const bordaSlug = BORDA_SLUG[plano.slug] ?? 'border-[#1e1e20]'
  const headerSlug = HEADER_SLUG[plano.slug] ?? ''

  const totalRecursos = Object.keys(plano.recursos).length

  return (
    <div className={`flex flex-col rounded-xl border ${bordaSlug} overflow-hidden`}>
      <div className={`border-b ${bordaSlug} ${headerSlug} px-5 py-4`}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Plano</p>
            <h2 className={`text-lg font-semibold ${corSlug}`}>{plano.nome}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-zinc-200">
              R$ {Number(plano.preco).toFixed(2)}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">/mês</p>
          </div>
        </div>

        {plano.descricao && (
          <p className="mt-2 text-xs text-zinc-500">{plano.descricao}</p>
        )}

        {/* Link Lastlink */}
        <div className="mt-3">
          {plano.lastlink_url ? (
            <a
              href={plano.lastlink_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-blue-400 transition-colors hover:bg-blue-500/20"
            >
              <Link2Icon className="h-3 w-3" />
              Lastlink vinculado
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600">
              <Link2Icon className="h-3 w-3" />
              Sem link Lastlink
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
            {totalRecursos} recursos
          </span>
          {!plano.ativo && (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-red-400">
              Plano inativo
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 bg-[#0a0a0b] p-4">
        {Object.entries(plano.recursos).length === 0 ? (
          <p className="py-4 text-center font-mono text-xs text-zinc-600">
            Nenhum recurso configurado
          </p>
        ) : (
          Object.entries(plano.recursos).map(([chave, valor]) => (
            <LinhaRecurso
              key={chave}
              planoId={plano.id}
              chave={chave}
              valor={valor}
            />
          ))
        )}
        <AdicionarRecurso plano={plano} />
      </div>
    </div>
  )
}

// ─── Modal de criação de plano ────────────────────────────────────────────────

interface ModalCriarPlanoProps {
  onFechar: () => void
  onCriado: () => void
}

const CAMPO = 'rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 placeholder:text-zinc-600'

function ModalCriarPlano({ onFechar, onCriado }: ModalCriarPlanoProps) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    slug: '',
    nome: '',
    descricao: '',
    preco: '',
    ordem: '',
    ativo: true,
    lastlink_url: '',
  })
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      criarPlano({
        slug: form.slug.trim(),
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco: parseFloat(form.preco) || 0,
        ordem: parseInt(form.ordem) || 0,
        ativo: form.ativo,
        lastlink_url: form.lastlink_url.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanosKeys.lista() })
      onCriado()
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erro ao criar plano.'
      setErro(msg)
    },
  })

  function set(campo: string, valor: string | boolean) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#2a2a2e] bg-[#0d0d0f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e20] px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C9B882]/70">admin</p>
            <h2 className="text-base font-semibold text-white">Novo Plano</h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 px-6 py-5">
          {/* Slug + Nome */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="ex: premium"
                className={CAMPO}
              />
              <p className="font-mono text-[10px] text-zinc-600">Apenas letras minúsculas, números, - e _</p>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="ex: Premium"
                className={CAMPO}
              />
            </div>
          </div>

          {/* Preço + Ordem */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Preço (R$) *</label>
              <input
                type="number"
                value={form.preco}
                onChange={(e) => set('preco', e.target.value)}
                min={0}
                step="0.01"
                placeholder="0.00"
                className={CAMPO}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Ordem *</label>
              <input
                type="number"
                value={form.ordem}
                onChange={(e) => set('ordem', e.target.value)}
                min={0}
                placeholder="0"
                className={CAMPO}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              rows={2}
              placeholder="Descrição opcional do plano"
              className={`${CAMPO} resize-none`}
            />
          </div>

          {/* Lastlink URL */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              URL Lastlink <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              type="url"
              value={form.lastlink_url}
              onChange={(e) => set('lastlink_url', e.target.value)}
              placeholder="https://..."
              className={CAMPO}
            />
            <p className="font-mono text-[10px] text-zinc-600">
              Quando preenchida, alunos que comprarem por esse link serão vinculados automaticamente a este plano.
            </p>
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo-novo-plano"
              checked={form.ativo}
              onChange={(e) => set('ativo', e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[#C9B882]"
            />
            <label htmlFor="ativo-novo-plano" className="cursor-pointer font-mono text-sm text-zinc-300">
              Plano ativo
            </label>
          </div>

          {erro && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">
              {erro}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#1e1e20] px-6 py-4">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border border-zinc-700/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || !form.slug || !form.nome || !form.preco}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Criando…
              </>
            ) : (
              <>
                <PlusIcon className="h-3 w-3" />
                Criar Plano
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AdminPlanos() {
  const [modalAberto, setModalAberto] = useState(false)

  const { data: planos, isLoading, isError } = useQuery({
    queryKey: adminPlanosKeys.lista(),
    queryFn: fetchPlanos,
    staleTime: 30_000,
  })

  const planosOrdenados = planos ? [...planos].sort((a, b) => a.ordem - b.ordem) : []

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">
            admin
          </p>
          <h1 className="text-2xl font-semibold text-white">Planos &amp; Recursos</h1>
          <p className="text-sm text-zinc-400">
            Gerencie os planos disponíveis e configure os recursos e limites de cada um.
          </p>
        </div>

        <div className="flex items-start gap-3">
          {!isLoading && planos && (
            <div className="flex-shrink-0 rounded-xl border border-[#1e1e20] bg-[#111113] px-4 py-3 text-center">
              <p className="font-mono text-xl font-semibold text-white">{planos.length}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                planos
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#C9B882]/25 bg-[#C9B882]/8 px-4 py-3 font-mono text-sm text-[#C9B882] transition-colors hover:bg-[#C9B882]/15"
          >
            <PlusIcon className="h-4 w-4" />
            Novo Plano
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
          Não foi possível carregar os planos. Verifique a conexão e tente novamente.
        </div>
      )}

      {planosOrdenados.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {planosOrdenados.map((plano) => (
            <CardPlano key={plano.id} plano={plano} />
          ))}
        </div>
      )}

      {modalAberto && (
        <ModalCriarPlano
          onFechar={() => setModalAberto(false)}
          onCriado={() => setModalAberto(false)}
        />
      )}
    </div>
  )
}
