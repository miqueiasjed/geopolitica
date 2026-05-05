import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircledIcon,
  Cross2Icon,
  Pencil1Icon,
  PlusIcon,
  Link2Icon,
} from '@radix-ui/react-icons'
import {
  fetchPlanos,
  fetchRoles,
  atualizarRecurso,
  atualizarPlano,
  criarPlano,
  adminPlanosKeys,
} from '../../services/adminPlanos'
import type { Plano, PlanoRecursoItem } from '../../services/adminPlanos'

// ─── Constantes ───────────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  chat_diario_limite:       'Chat (por dia)',
  relatorio_mensal_limite:  'Relatórios IA (por mês)',
  feed_historico_dias:      'Histórico do Feed (dias)',
  feed_paginacao_limite:    'Feed — Itens por Página',
  conteudo_historico_dias:  'Conteúdo — Histórico (dias)',
  conteudo_nivel_maximo:    'Conteúdo — Nível',
  paises_seguidos_limite:   'Países Seguidos',
  biblioteca_acesso:        'Biblioteca',
  monitor_eleitoral:        'Monitor Eleitoral',
  monitor_guerra:           'Monitor de Guerra',
  risk_score:               'Risk Score',
  alertas_nivel:            'Nível de Alertas',
}

const COR: Record<string, { text: string; border: string; bg: string }> = {
  essencial: { text: 'text-amber-400',  border: 'border-amber-500/20',  bg: 'bg-amber-500/5'  },
  pro:       { text: 'text-cyan-400',   border: 'border-cyan-500/20',   bg: 'bg-cyan-500/5'   },
  reservado: { text: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
}

function cor(slug: string) {
  return COR[slug] ?? { text: 'text-zinc-300', border: 'border-zinc-700/40', bg: 'bg-zinc-800/10' }
}

// ─── Tipos de recurso ─────────────────────────────────────────────────────────

type TipoRecurso = 'boolean' | 'numero' | 'alertas_nivel'

function inferirTipo(chave: string): TipoRecurso {
  if (chave === 'alertas_nivel') return 'alertas_nivel'
  if (
    chave.includes('acesso') ||
    chave.includes('monitor') ||
    chave.includes('risk_score') ||
    chave.includes('biblioteca')
  ) return 'boolean'
  if (chave.includes('_limite') || chave.includes('_dias')) return 'numero'
  return 'boolean'
}

// ─── Badge de valor ───────────────────────────────────────────────────────────

function BadgeValor({ valor, chave }: { valor: PlanoRecursoItem | undefined; chave: string }) {
  if (valor === undefined) return <span className="text-zinc-700 text-xs">—</span>

  if (valor === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[11px] text-green-400">
        ∞ ilimitado
      </span>
    )
  }

  if (valor === 'false') return <span className="font-mono text-xs text-zinc-600">Não</span>

  if (valor === 'true') {
    return (
      <span className="inline-flex items-center gap-1 text-green-400">
        <CheckCircledIcon className="h-3.5 w-3.5" />
        <span className="font-mono text-xs">Sim</span>
      </span>
    )
  }

  if (chave.includes('_dias')) {
    return (
      <span className="font-mono text-sm text-zinc-200">
        {valor}<span className="ml-1 text-[11px] text-zinc-500">dias</span>
      </span>
    )
  }

  return <span className="font-mono text-sm text-zinc-200">{valor}</span>
}

// ─── Editor inline de célula ─────────────────────────────────────────────────

const INPUT_SM =
  'rounded border border-zinc-700 bg-[#0d0d0f] px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-[#C9B882]/50'

interface EditorCelulaProps {
  planoId: number
  chave: string
  valor: PlanoRecursoItem
  onConcluir: () => void
}

function EditorCelula({ planoId, chave, valor, onConcluir }: EditorCelulaProps) {
  const queryClient = useQueryClient()
  const tipo = inferirTipo(chave)
  const [valorLocal, setValorLocal] = useState<string>(valor ?? (tipo === 'boolean' ? 'false' : ''))
  const [ilimitado, setIlimitado] = useState(valor === null)

  const mutation = useMutation({
    mutationFn: () => {
      const v =
        tipo === 'boolean'
          ? valorLocal === 'true' ? 'true' : 'false'
          : tipo === 'numero' && ilimitado
            ? null
            : valorLocal
      return atualizarRecurso(planoId, chave, v)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanosKeys.lista() })
      onConcluir()
    },
  })

  return (
    <div className="flex flex-col gap-2 min-w-[130px]">
      {tipo === 'boolean' && (
        <select
          value={valorLocal}
          onChange={(e) => setValorLocal(e.target.value)}
          className={`${INPUT_SM} cursor-pointer`}
        >
          <option value="true"  className="bg-[#0d0d0f]">Sim</option>
          <option value="false" className="bg-[#0d0d0f]">Não</option>
        </select>
      )}

      {tipo === 'numero' && (
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ilimitado}
              onChange={(e) => { setIlimitado(e.target.checked); if (e.target.checked) setValorLocal('') }}
              className="accent-[#C9B882] h-3 w-3"
            />
            <span className="font-mono text-[10px] text-zinc-500">Ilimitado</span>
          </label>
          {!ilimitado && (
            <input
              type="number"
              value={valorLocal}
              onChange={(e) => setValorLocal(e.target.value)}
              min={0}
              className={`${INPUT_SM} w-20`}
            />
          )}
        </div>
      )}

      {tipo === 'alertas_nivel' && (
        <select
          value={valorLocal}
          onChange={(e) => setValorLocal(e.target.value)}
          className={`${INPUT_SM} cursor-pointer`}
        >
          <option value="medium"       className="bg-[#0d0d0f]">Médio</option>
          <option value="medium,high"  className="bg-[#0d0d0f]">Médio + Alto</option>
          <option value="all"          className="bg-[#0d0d0f]">Todos</option>
        </select>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="inline-flex items-center gap-1 rounded border border-[#C9B882]/30 bg-[#C9B882]/10 px-2 py-0.5 font-mono text-[10px] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:opacity-50"
        >
          {mutation.isPending ? '…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onConcluir}
          className="rounded border border-zinc-700/50 p-0.5 text-zinc-500 hover:text-zinc-300"
        >
          <Cross2Icon className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Célula da tabela ─────────────────────────────────────────────────────────

interface CelulaRecursoProps {
  planoId: number
  chave: string
  valor: PlanoRecursoItem | undefined
}

function CelulaRecurso({ planoId, chave, valor }: CelulaRecursoProps) {
  const [editando, setEditando] = useState(false)

  if (editando) {
    return (
      <td className="px-4 py-3 align-top bg-[#C9B882]/3 border-l border-[#1e1e20]">
        <EditorCelula
          planoId={planoId}
          chave={chave}
          valor={valor ?? (inferirTipo(chave) === 'boolean' ? 'false' : '0')}
          onConcluir={() => setEditando(false)}
        />
      </td>
    )
  }

  return (
    <td className="px-4 py-3 border-l border-[#1e1e20] group">
      <div className="flex items-center gap-2">
        <BadgeValor valor={valor} chave={chave} />
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
          aria-label="Editar"
        >
          {valor === undefined ? <PlusIcon className="h-3 w-3" /> : <Pencil1Icon className="h-3 w-3" />}
        </button>
      </div>
    </td>
  )
}

// ─── Tabela comparativa de recursos ──────────────────────────────────────────

function TabelaRecursos({ planos }: { planos: Plano[] }) {
  const todasAsChaves = Array.from(
    new Set([
      ...Object.keys(LABELS),
      ...planos.flatMap((p) => Object.keys(p.recursos)),
    ]),
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-[#1e1e20]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e1e20] bg-[#080809]">
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 w-52">
              Recurso
            </th>
            {planos.map((plano) => {
              const c = cor(plano.slug)
              return (
                <th
                  key={plano.id}
                  className={`px-4 py-3 text-left font-mono text-[11px] font-semibold border-l border-[#1e1e20] ${c.text}`}
                >
                  {plano.nome}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {todasAsChaves.map((chave, idx) => (
            <tr
              key={chave}
              className={`border-b border-[#111113] transition-colors hover:bg-[#111115] ${idx % 2 === 0 ? 'bg-[#0d0d0f]' : 'bg-[#0a0a0b]'}`}
            >
              <td className="px-4 py-3">
                <p className="text-xs text-zinc-300 font-medium leading-tight">
                  {LABELS[chave] ?? chave}
                </p>
                <p className="font-mono text-[9px] text-zinc-700 mt-0.5">{chave}</p>
              </td>
              {planos.map((plano) => (
                <CelulaRecurso
                  key={plano.id}
                  planoId={plano.id}
                  chave={chave}
                  valor={plano.recursos[chave]}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Card de resumo do plano ─────────────────────────────────────────────────

interface CardResumoplanoProps {
  plano: Plano
  onEditar: (plano: Plano) => void
}

function CardResumoplano({ plano, onEditar }: CardResumoplanoProps) {
  const c = cor(plano.slug)

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <div className={`${c.bg} border-b ${c.border} px-4 py-3`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">{plano.slug}</p>
            <h3 className={`text-base font-semibold ${c.text}`}>{plano.nome}</h3>
            {plano.descricao && (
              <p className="mt-0.5 text-xs text-zinc-500 leading-tight">{plano.descricao}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-mono text-base font-semibold text-zinc-200">
              R$ {Number(plano.preco).toFixed(2)}
            </p>
            <p className="font-mono text-[9px] text-zinc-600">/mês</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-[#0a0a0b] space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {plano.ativo ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[10px] text-green-400">
              <CheckCircledIcon className="h-2.5 w-2.5" /> Ativo
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400">
              Inativo
            </span>
          )}

          {plano.role && (
            <span className="inline-flex items-center rounded-full bg-zinc-700/40 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
              {plano.role}
            </span>
          )}

          {plano.lastlink_url ? (
            <a
              href={plano.lastlink_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] text-blue-400 hover:bg-blue-500/15 transition-colors"
            >
              <Link2Icon className="h-2.5 w-2.5" /> Lastlink
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800/50 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
              <Link2Icon className="h-2.5 w-2.5" /> Sem link
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEditar(plano)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700/50 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          <Pencil1Icon className="h-3 w-3" />
          Editar plano
        </button>
      </div>
    </div>
  )
}

// ─── Modal de edição do plano ────────────────────────────────────────────────

interface ModalEditarPlanoProps {
  plano: Plano
  onFechar: () => void
}

const CAMPO =
  'rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 placeholder:text-zinc-600'

function ModalEditarPlano({ plano, onFechar }: ModalEditarPlanoProps) {
  const queryClient = useQueryClient()
  const c = cor(plano.slug)

  const [form, setForm] = useState({
    nome:         plano.nome,
    descricao:    plano.descricao ?? '',
    preco:        String(plano.preco),
    ordem:        String(plano.ordem),
    ativo:        plano.ativo,
    lastlink_url: plano.lastlink_url ?? '',
    role:         plano.role ?? '',
  })
  const [erro, setErro] = useState<string | null>(null)

  const { data: roles } = useQuery({
    queryKey: adminPlanosKeys.roles(),
    queryFn: fetchRoles,
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: () =>
      atualizarPlano(plano.id, {
        nome:         form.nome.trim(),
        descricao:    form.descricao.trim() || null,
        preco:        parseFloat(form.preco) || 0,
        ordem:        parseInt(form.ordem) || 0,
        ativo:        form.ativo,
        lastlink_url: form.lastlink_url.trim() || null,
        role:         form.role.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanosKeys.lista() })
      onFechar()
    },
    onError: (e: unknown) => {
      setErro(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao salvar.',
      )
    },
  })

  function set(campo: string, valor: string | boolean) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#2a2a2e] bg-[#0d0d0f] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className={`flex items-center justify-between border-b border-[#1e1e20] px-6 py-4 ${c.bg}`}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C9B882]/70">Editar Plano</p>
            <h2 className={`text-base font-semibold ${c.text}`}>{plano.nome}</h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Nome</label>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} className={CAMPO} />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Preço (R$)</label>
              <input type="number" value={form.preco} onChange={(e) => set('preco', e.target.value)} min={0} step="0.01" className={CAMPO} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Ordem</label>
              <input type="number" value={form.ordem} onChange={(e) => set('ordem', e.target.value)} min={0} className={CAMPO} />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Status</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => set('ativo', e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#C9B882]"
                />
                <span className="font-mono text-sm text-zinc-300">Plano ativo</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              rows={2}
              placeholder="Opcional"
              className={`${CAMPO} resize-none`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Perfil (role)</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className={`${CAMPO} cursor-pointer`}>
              <option value="" className="bg-[#111113]">— nenhuma —</option>
              {roles?.map((r) => (
                <option key={r.role} value={r.role} className="bg-[#111113]">
                  {r.label} ({r.role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              URL Lastlink <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <input
              type="url"
              value={form.lastlink_url}
              onChange={(e) => set('lastlink_url', e.target.value)}
              placeholder="https://..."
              className={CAMPO}
            />
          </div>

          {erro && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">
              {erro}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#1e1e20] px-6 py-4">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border border-zinc-700/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || !form.nome || !form.preco}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Salvando…
              </>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de criação de plano ────────────────────────────────────────────────

interface ModalCriarPlanoProps {
  onFechar: () => void
  onCriado: () => void
}

function ModalCriarPlano({ onFechar, onCriado }: ModalCriarPlanoProps) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    slug: '', nome: '', descricao: '', preco: '', ordem: '', ativo: true, lastlink_url: '',
  })
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      criarPlano({
        slug:         form.slug.trim(),
        nome:         form.nome.trim(),
        descricao:    form.descricao.trim() || null,
        preco:        parseFloat(form.preco) || 0,
        ordem:        parseInt(form.ordem) || 0,
        ativo:        form.ativo,
        lastlink_url: form.lastlink_url.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanosKeys.lista() })
      onCriado()
    },
    onError: (e: unknown) => {
      setErro(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao criar plano.',
      )
    },
  })

  function set(campo: string, valor: string | boolean) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#2a2a2e] bg-[#0d0d0f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e1e20] px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C9B882]/70">admin</p>
            <h2 className="text-base font-semibold text-white">Novo Plano</h2>
          </div>
          <button type="button" onClick={onFechar} className="rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
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
              <p className="font-mono text-[10px] text-zinc-600">Minúsculas, números, - e _</p>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Nome *</label>
              <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="ex: Premium" className={CAMPO} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Preço (R$) *</label>
              <input type="number" value={form.preco} onChange={(e) => set('preco', e.target.value)} min={0} step="0.01" placeholder="0.00" className={CAMPO} />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Ordem</label>
              <input type="number" value={form.ordem} onChange={(e) => set('ordem', e.target.value)} min={0} placeholder="0" className={CAMPO} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Descrição</label>
            <textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={2} placeholder="Opcional" className={`${CAMPO} resize-none`} />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">URL Lastlink <span className="text-zinc-600 normal-case">(opcional)</span></label>
            <input type="url" value={form.lastlink_url} onChange={(e) => set('lastlink_url', e.target.value)} placeholder="https://..." className={CAMPO} />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)} className="h-4 w-4 accent-[#C9B882]" />
            <span className="font-mono text-sm text-zinc-300">Plano ativo</span>
          </label>

          {erro && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">{erro}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#1e1e20] px-6 py-4">
          <button type="button" onClick={onFechar} className="rounded-full border border-zinc-700/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300">
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || !form.slug || !form.nome || !form.preco}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Criando…
              </>
            ) : (
              <><PlusIcon className="h-3 w-3" />Criar Plano</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AdminPlanos() {
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null)
  const [modalCriarAberto, setModalCriarAberto] = useState(false)

  const { data: planos, isLoading, isError } = useQuery({
    queryKey: adminPlanosKeys.lista(),
    queryFn: fetchPlanos,
    staleTime: 30_000,
  })

  const planosOrdenados = planos ? [...planos].sort((a, b) => a.ordem - b.ordem) : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#C9B882]/70">admin</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Planos &amp; Recursos</h1>
          <p className="text-sm text-zinc-400">
            Configure os planos e compare os recursos disponíveis em cada um.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalCriarAberto(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#C9B882]/25 bg-[#C9B882]/8 px-4 py-3 font-mono text-sm text-[#C9B882] transition-colors hover:bg-[#C9B882]/15"
        >
          <PlusIcon className="h-4 w-4" />
          Novo Plano
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]" aria-hidden="true" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
          Não foi possível carregar os planos. Verifique a conexão e tente novamente.
        </div>
      )}

      {planosOrdenados.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {planosOrdenados.map((plano) => (
              <CardResumoplano key={plano.id} plano={plano} onEditar={setPlanoEditando} />
            ))}
          </div>

          <TabelaRecursos planos={planosOrdenados} />
        </>
      )}

      {planoEditando && (
        <ModalEditarPlano plano={planoEditando} onFechar={() => setPlanoEditando(null)} />
      )}

      {modalCriarAberto && (
        <ModalCriarPlano onFechar={() => setModalCriarAberto(false)} onCriado={() => setModalCriarAberto(false)} />
      )}
    </div>
  )
}
