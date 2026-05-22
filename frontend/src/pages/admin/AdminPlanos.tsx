import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircledIcon,
  Cross2Icon,
  EyeOpenIcon,
  Pencil1Icon,
  PlusIcon,
  Link2Icon,
} from '@radix-ui/react-icons'
import {
  fetchPlanos,
  fetchRoles,
  fetchOfertasPorPlano,
  criarOferta,
  deletarOferta,
  atualizarRecurso,
  atualizarPlano,
  criarPlano,
  adminPlanosKeys,
} from '../../services/adminPlanos'
import type { Plano, PlanoRecursoItem } from '../../services/adminPlanos'

// ─── Constantes ───────────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  chat_diario_limite:      'Chat (por dia)',
  relatorio_mensal_limite: 'Relatórios IA (por mês)',
  feed_historico_dias:     'Histórico do Feed (dias)',
  feed_paginacao_limite:   'Feed — Itens por Página',
  conteudo_historico_dias: 'Conteúdo — Histórico (dias)',
  conteudo_nivel_maximo:   'Conteúdo — Nível',
  paises_seguidos_limite:  'Países Seguidos',
  biblioteca_acesso:       'Biblioteca',
  monitor_eleitoral:       'Monitor Eleitoral',
  monitor_guerra:          'Monitor de Guerra',
  risk_score:              'Risk Score',
  alertas_nivel:           'Nível de Alertas',
}

const GRUPOS: { titulo: string; chaves: string[] }[] = [
  {
    titulo: 'Limites de uso',
    chaves: ['chat_diario_limite', 'relatorio_mensal_limite', 'feed_paginacao_limite', 'paises_seguidos_limite'],
  },
  {
    titulo: 'Histórico',
    chaves: ['feed_historico_dias', 'conteudo_historico_dias'],
  },
  {
    titulo: 'Acesso a recursos',
    chaves: ['biblioteca_acesso', 'monitor_eleitoral', 'monitor_guerra', 'risk_score'],
  },
  {
    titulo: 'Configurações',
    chaves: ['conteudo_nivel_maximo', 'alertas_nivel'],
  },
]

const COR: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  essencial: { text: 'text-amber-400',  border: 'border-amber-500/20',  bg: 'bg-amber-500/5',  dot: 'bg-amber-400'  },
  pro:       { text: 'text-cyan-400',   border: 'border-cyan-500/20',   bg: 'bg-cyan-500/5',   dot: 'bg-cyan-400'   },
  reservado: { text: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5', dot: 'bg-purple-400' },
}

function cor(slug: string) {
  return COR[slug] ?? { text: 'text-zinc-300', border: 'border-zinc-700/40', bg: 'bg-zinc-800/10', dot: 'bg-zinc-400' }
}

// ─── Tipos de recurso ─────────────────────────────────────────────────────────

type TipoRecurso = 'boolean' | 'numero' | 'alertas_nivel' | 'conteudo_nivel'

function inferirTipo(chave: string): TipoRecurso {
  if (chave === 'alertas_nivel') return 'alertas_nivel'
  if (chave === 'conteudo_nivel_maximo') return 'conteudo_nivel'
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

  if (valor === 'false') {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700/30 px-2 py-0.5 font-mono text-[11px] text-zinc-500">
        Não
      </span>
    )
  }

  if (valor === 'true') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[11px] text-green-400">
        <CheckCircledIcon className="h-3 w-3" />
        Sim
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

// ─── Editor inline de recurso ─────────────────────────────────────────────────

const INPUT_SM =
  'rounded border border-zinc-700 bg-[#0d0d0f] px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-[#C9B882]/50'

interface EditorRecursoProps {
  planoId: number
  chave: string
  valor: PlanoRecursoItem
  onConcluir: () => void
}

function EditorRecurso({ planoId, chave, valor, onConcluir }: EditorRecursoProps) {
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
    <div className="flex items-center gap-2 flex-wrap">
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
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ilimitado}
              onChange={(e) => { setIlimitado(e.target.checked); if (e.target.checked) setValorLocal('') }}
              className="accent-[#C9B882] h-3 w-3"
            />
            <span className="font-mono text-[10px] text-zinc-500">∞</span>
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
          <option value="medium"      className="bg-[#0d0d0f]">Médio</option>
          <option value="medium,high" className="bg-[#0d0d0f]">Médio + Alto</option>
          <option value="all"         className="bg-[#0d0d0f]">Todos</option>
        </select>
      )}

      {tipo === 'conteudo_nivel' && (
        <select
          value={valorLocal}
          onChange={(e) => setValorLocal(e.target.value)}
          className={`${INPUT_SM} cursor-pointer`}
        >
          <option value="essencial" className="bg-[#0d0d0f]">Essencial</option>
          <option value="pro"       className="bg-[#0d0d0f]">Pro</option>
          <option value="todos"     className="bg-[#0d0d0f]">Todos</option>
        </select>
      )}

      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="inline-flex items-center gap-1 rounded border border-[#C9B882]/30 bg-[#C9B882]/10 px-2 py-1 font-mono text-[10px] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:opacity-50"
      >
        {mutation.isPending ? '…' : 'OK'}
      </button>
      <button
        type="button"
        onClick={onConcluir}
        className="rounded border border-zinc-700/50 p-1 text-zinc-500 hover:text-zinc-300"
      >
        <Cross2Icon className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Linha de recurso ─────────────────────────────────────────────────────────

interface LinhaRecursoProps {
  planoId: number
  chave: string
  valor: PlanoRecursoItem | undefined
  editavel: boolean
}

function LinhaRecurso({ planoId, chave, valor, editavel }: LinhaRecursoProps) {
  const [editando, setEditando] = useState(false)

  return (
    <tr className="border-b border-[#111113] group hover:bg-[#111115] transition-colors last:border-0">
      <td className="px-4 py-3 w-56">
        <p className="text-sm text-zinc-200 font-medium leading-tight">{LABELS[chave] ?? chave}</p>
        <p className="font-mono text-[10px] text-zinc-600 mt-0.5">{chave}</p>
      </td>
      <td className="px-4 py-3">
        {editando && editavel ? (
          <EditorRecurso
            planoId={planoId}
            chave={chave}
            valor={valor ?? (inferirTipo(chave) === 'boolean' ? 'false' : '0')}
            onConcluir={() => setEditando(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <BadgeValor valor={valor} chave={chave} />
            {editavel && (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
                aria-label="Editar recurso"
              >
                <Pencil1Icon className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Painel de recursos ───────────────────────────────────────────────────────

function PainelRecursos({ plano, editavel }: { plano: Plano; editavel: boolean }) {
  const chavesNoGrupo = new Set(GRUPOS.flatMap((g) => g.chaves))
  const chavesExtras = Object.keys(plano.recursos).filter((c) => !chavesNoGrupo.has(c))

  const grupos = [
    ...GRUPOS,
    ...(chavesExtras.length > 0 ? [{ titulo: 'Outros', chaves: chavesExtras }] : []),
  ]

  return (
    <div className="space-y-3">
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="rounded-xl border border-[#1e1e20] overflow-hidden">
          <div className="bg-[#080809] px-4 py-2 border-b border-[#1e1e20]">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {grupo.titulo}
            </p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {grupo.chaves.map((chave) => (
                <LinhaRecurso
                  key={chave}
                  planoId={plano.id}
                  chave={chave}
                  valor={plano.recursos[chave]}
                  editavel={editavel}
                />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

// ─── Tabela de planos ─────────────────────────────────────────────────────────

interface TabelaPlanosProps {
  planos: Plano[]
  onVisualizar: (plano: Plano) => void
  onEditar: (plano: Plano) => void
}

function TabelaPlanos({ planos, onVisualizar, onEditar }: TabelaPlanosProps) {
  return (
    <div className="rounded-xl border border-[#1e1e20] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e1e20] bg-[#080809]">
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Plano</th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Preço</th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Status</th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Role</th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Recursos</th>
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Lastlink</th>
            <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Ações</th>
          </tr>
        </thead>
        <tbody>
          {planos.map((plano, idx) => {
            const c = cor(plano.slug)
            const numRecursos = Object.keys(plano.recursos).length
            return (
              <tr
                key={plano.id}
                className={`border-b border-[#111113] transition-colors hover:bg-[#111115] ${idx % 2 === 0 ? 'bg-[#0d0d0f]' : 'bg-[#0a0a0b]'}`}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${c.dot}`} />
                    <div>
                      <p className={`font-semibold text-sm ${c.text}`}>{plano.nome}</p>
                      <p className="font-mono text-[10px] text-zinc-600">{plano.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-mono text-sm font-medium text-zinc-200">
                    R$ {Number(plano.preco).toFixed(2)}
                  </p>
                  <p className="font-mono text-[10px] text-zinc-600">/mês</p>
                </td>
                <td className="px-4 py-3.5">
                  {plano.ativo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[10px] text-green-400">
                      <CheckCircledIcon className="h-2.5 w-2.5" /> Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {plano.role ? (
                    <span className="inline-flex items-center rounded-full bg-zinc-700/40 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                      {plano.role}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                    {numRecursos}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {plano.lastlink_url ? (
                    <a
                      href={plano.lastlink_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Link2Icon className="h-3 w-3" /> Link
                    </a>
                  ) : (
                    <span className="font-mono text-[10px] text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onVisualizar(plano)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
                    >
                      <EyeOpenIcon className="h-3 w-3" />
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditar(plano)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9B882]/25 bg-[#C9B882]/5 px-2.5 py-1.5 font-mono text-[11px] text-[#C9B882] hover:bg-[#C9B882]/12 transition-colors"
                    >
                      <Pencil1Icon className="h-3 w-3" />
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Modal de visualização ────────────────────────────────────────────────────

function ModalVisualizarPlano({ planoId, onFechar }: { planoId: number; onFechar: () => void }) {
  const { data: planos } = useQuery({
    queryKey: adminPlanosKeys.lista(),
    queryFn: fetchPlanos,
    staleTime: 30_000,
  })
  const plano = planos?.find((p) => p.id === planoId)

  if (!plano) return null
  const c = cor(plano.slug)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#2a2a2e] bg-[#0d0d0f] shadow-2xl max-h-[90vh] flex flex-col">
        <div className={`flex items-center justify-between border-b border-[#1e1e20] px-6 py-4 flex-shrink-0 ${c.bg}`}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C9B882]/70">{plano.slug}</p>
            <h2 className={`text-lg font-semibold ${c.text}`}>{plano.nome}</h2>
            {plano.descricao && (
              <p className="mt-0.5 text-xs text-zinc-500 leading-tight">{plano.descricao}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-mono text-base font-semibold text-zinc-200">
                R$ {Number(plano.preco).toFixed(2)}
              </p>
              <p className="font-mono text-[9px] text-zinc-600">/mês</p>
            </div>
            <button
              type="button"
              onClick={onFechar}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {plano.ativo ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 font-mono text-[11px] text-green-400">
                <CheckCircledIcon className="h-3 w-3" /> Ativo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-1 font-mono text-[11px] text-red-400">
                Inativo
              </span>
            )}
            {plano.role && (
              <span className="inline-flex items-center rounded-full bg-zinc-700/40 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
                {plano.role}
              </span>
            )}
            {plano.lastlink_url && (
              <a
                href={plano.lastlink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 font-mono text-[11px] text-blue-400 hover:bg-blue-500/15 transition-colors"
              >
                <Link2Icon className="h-3 w-3" /> Lastlink
              </a>
            )}
          </div>

          <PainelRecursos plano={plano} editavel={false} />
        </div>
      </div>
    </div>
  )
}

// ─── Painel de ofertas (webhook_offer_planos) ─────────────────────────────────

function PainelOfertas({ planoSlug }: { planoSlug: string }) {
  const queryClient = useQueryClient()
  const [fonte, setFonte] = useState<'hotmart' | 'lastlink'>('hotmart')
  const [offerId, setOfferId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erroAdd, setErroAdd] = useState<string | null>(null)

  const { data: ofertas = [], isLoading } = useQuery({
    queryKey: adminPlanosKeys.ofertas(planoSlug),
    queryFn: () => fetchOfertasPorPlano(planoSlug),
  })

  const mutAdd = useMutation({
    mutationFn: () => criarOferta({ fonte, offer_id: offerId.trim(), descricao: descricao.trim(), plano: planoSlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanosKeys.ofertas(planoSlug) })
      setOfferId('')
      setDescricao('')
      setErroAdd(null)
    },
    onError: (e: unknown) => {
      setErroAdd(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao adicionar oferta.',
      )
    },
  })

  const mutDel = useMutation({
    mutationFn: deletarOferta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminPlanosKeys.ofertas(planoSlug) }),
  })

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="font-mono text-[11px] text-zinc-600">Carregando…</p>
      ) : ofertas.length === 0 ? (
        <p className="font-mono text-[11px] text-zinc-600">Nenhuma oferta cadastrada.</p>
      ) : (
        <div className="rounded-xl border border-[#1e1e20] overflow-hidden">
          {ofertas.map((oferta) => (
            <div
              key={oferta.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-[#111113] last:border-0 group hover:bg-[#111115] transition-colors"
            >
              <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] ${
                oferta.fonte === 'hotmart'
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
                {oferta.fonte}
              </span>
              <span className="font-mono text-xs text-zinc-200 w-32 flex-shrink-0 truncate">{oferta.offer_id}</span>
              <span className="text-xs text-zinc-500 flex-1 truncate">{oferta.descricao}</span>
              <button
                type="button"
                onClick={() => mutDel.mutate(oferta.id)}
                disabled={mutDel.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-zinc-600 hover:text-red-400 disabled:opacity-30"
                aria-label="Remover oferta"
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 flex-wrap pt-1">
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-zinc-600">Fonte</p>
          <select
            value={fonte}
            onChange={(e) => setFonte(e.target.value as 'hotmart' | 'lastlink')}
            className={`${INPUT_SM} cursor-pointer`}
          >
            <option value="hotmart" className="bg-[#0d0d0f]">Hotmart</option>
            <option value="lastlink" className="bg-[#0d0d0f]">Lastlink</option>
          </select>
        </div>
        <div className="space-y-1 w-36">
          <p className="font-mono text-[10px] text-zinc-600">Offer ID</p>
          <input
            type="text"
            value={offerId}
            onChange={(e) => { setOfferId(e.target.value); setErroAdd(null) }}
            placeholder="ex: abc123"
            className={`${INPUT_SM} w-full`}
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[140px]">
          <p className="font-mono text-[10px] text-zinc-600">Descrição</p>
          <input
            type="text"
            value={descricao}
            onChange={(e) => { setDescricao(e.target.value); setErroAdd(null) }}
            placeholder="ex: Plano Pro Mensal"
            className={`${INPUT_SM} w-full`}
          />
        </div>
        <button
          type="button"
          disabled={!offerId.trim() || !descricao.trim() || mutAdd.isPending}
          onClick={() => mutAdd.mutate()}
          className="inline-flex items-center gap-1 rounded border border-[#C9B882]/30 bg-[#C9B882]/10 px-2.5 py-1.5 font-mono text-[10px] text-[#C9B882] hover:bg-[#C9B882]/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-3 w-3" />
          {mutAdd.isPending ? '…' : 'Adicionar'}
        </button>
      </div>
      {erroAdd && (
        <p className="font-mono text-[11px] text-red-400">{erroAdd}</p>
      )}
    </div>
  )
}

// ─── Modal de edição ──────────────────────────────────────────────────────────

const CAMPO =
  'rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 font-mono text-sm text-zinc-200 outline-none w-full transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 placeholder:text-zinc-600'

type AbaEditar = 'dados' | 'recursos' | 'identificadores'

function ModalEditarPlano({ planoId, onFechar }: { planoId: number; onFechar: () => void }) {
  const queryClient = useQueryClient()
  const [aba, setAba] = useState<AbaEditar>('dados')

  const { data: planos } = useQuery({
    queryKey: adminPlanosKeys.lista(),
    queryFn: fetchPlanos,
    staleTime: 30_000,
  })
  const plano = planos?.find((p) => p.id === planoId)

  const { data: roles } = useQuery({
    queryKey: adminPlanosKeys.roles(),
    queryFn: fetchRoles,
    staleTime: 60_000,
  })

  const [form, setFormState] = useState(() =>
    plano
      ? {
          nome:                plano.nome,
          descricao:           plano.descricao ?? '',
          preco:               String(plano.preco),
          ordem:               String(plano.ordem),
          ativo:               plano.ativo,
          lastlink_url:        plano.lastlink_url ?? '',
          role:                plano.role ?? '',
          product_id_hotmart:  plano.product_id_hotmart ?? '',
          product_id_lastlink: plano.product_id_lastlink ?? '',
        }
      : { nome: '', descricao: '', preco: '', ordem: '', ativo: true, lastlink_url: '', role: '', product_id_hotmart: '', product_id_lastlink: '' }
  )
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      atualizarPlano(planoId, {
        nome:                form.nome.trim(),
        descricao:           form.descricao.trim() || null,
        preco:               parseFloat(form.preco) || 0,
        ordem:               parseInt(form.ordem) || 0,
        ativo:               form.ativo,
        lastlink_url:        form.lastlink_url.trim() || null,
        role:                form.role.trim() || null,
        product_id_hotmart:  form.product_id_hotmart.trim() || null,
        product_id_lastlink: form.product_id_lastlink.trim() || null,
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
    setFormState((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  if (!plano) return null
  const c = cor(plano.slug)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#2a2a2e] bg-[#0d0d0f] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-[#1e1e20] px-6 py-4 flex-shrink-0 ${c.bg}`}>
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

        {/* Tabs */}
        <div className="flex border-b border-[#1e1e20] px-6 flex-shrink-0">
          {(['dados', 'recursos', 'identificadores'] as AbaEditar[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAba(a)}
              className={`px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] border-b-2 transition-colors -mb-px ${
                aba === a
                  ? 'border-[#C9B882] text-[#C9B882]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {a === 'dados' ? 'Dados' : a === 'recursos' ? 'Recursos' : 'Identificadores'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {aba === 'dados' && (
            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Nome</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => set('nome', e.target.value)}
                    className={CAMPO}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Preço (R$)</label>
                  <input
                    type="number"
                    value={form.preco}
                    onChange={(e) => set('preco', e.target.value)}
                    min={0}
                    step="0.01"
                    className={CAMPO}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Ordem</label>
                  <input
                    type="number"
                    value={form.ordem}
                    onChange={(e) => set('ordem', e.target.value)}
                    min={0}
                    className={CAMPO}
                  />
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
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className={`${CAMPO} cursor-pointer`}
                >
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
                  URL Lastlink{' '}
                  <span className="text-zinc-600 normal-case">(opcional)</span>
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
          )}

          {aba === 'recursos' && (
            <div className="px-6 py-5">
              <p className="mb-4 text-xs text-zinc-500">
                Clique no valor de qualquer recurso para editá-lo. As alterações são salvas individualmente.
              </p>
              <PainelRecursos plano={plano} editavel={true} />
            </div>
          )}

          {aba === 'identificadores' && (
            <div className="space-y-6 px-6 py-5">
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">IDs de Produto</p>
                <p className="text-xs text-zinc-600">Identificadores do produto principal em cada plataforma. O webhook usa este ID como primeira tentativa de resolução do plano.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      Hotmart <span className="text-zinc-600 normal-case">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.product_id_hotmart}
                      onChange={(e) => set('product_id_hotmart', e.target.value)}
                      placeholder="ex: 12345678"
                      className={CAMPO}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      Lastlink <span className="text-zinc-600 normal-case">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.product_id_lastlink}
                      onChange={(e) => set('product_id_lastlink', e.target.value)}
                      placeholder="ex: abc123"
                      className={CAMPO}
                    />
                  </div>
                </div>
                {erro && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[12px] text-red-400">
                    {erro}
                  </p>
                )}
              </div>

              <div className="border-t border-[#1e1e20]" />

              <div className="space-y-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Ofertas</p>
                  <p className="mt-1 text-xs text-zinc-600">Offer IDs vinculados a este plano. Um plano pode ter múltiplas ofertas (mensal, anual, promo). O webhook verifica estes IDs como fallback ao product_id.</p>
                </div>
                <PainelOfertas planoSlug={plano.slug} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#1e1e20] px-6 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border border-zinc-700/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          >
            {aba === 'recursos' ? 'Fechar' : 'Cancelar'}
          </button>
          {(aba === 'dados' || aba === 'identificadores') && (
            <button
              type="button"
              disabled={mutation.isPending || !form.nome || !form.preco}
              onClick={() => mutation.mutate()}
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
              ) : (
                'Salvar alterações'
              )}
            </button>
          )}
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

  const [form, setFormState] = useState({
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
    setFormState((prev) => ({ ...prev, [campo]: valor }))
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
              <input
                type="text"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="ex: Premium"
                className={CAMPO}
              />
            </div>
          </div>

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
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">Ordem</label>
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
            <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              URL Lastlink{' '}
              <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <input
              type="url"
              value={form.lastlink_url}
              onChange={(e) => set('lastlink_url', e.target.value)}
              placeholder="https://..."
              className={CAMPO}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => set('ativo', e.target.checked)}
              className="h-4 w-4 accent-[#C9B882]"
            />
            <span className="font-mono text-sm text-zinc-300">Plano ativo</span>
          </label>

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
            disabled={mutation.isPending || !form.slug || !form.nome || !form.preco}
            onClick={() => mutation.mutate()}
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
  const [planoVisualizando, setPlanoVisualizando] = useState<number | null>(null)
  const [planoEditando, setPlanoEditando] = useState<number | null>(null)
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
            Configure os planos e os recursos disponíveis em cada um.
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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[#1e1e20] bg-[#0d0d0f]"
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
        <TabelaPlanos
          planos={planosOrdenados}
          onVisualizar={(p) => setPlanoVisualizando(p.id)}
          onEditar={(p) => setPlanoEditando(p.id)}
        />
      )}

      {planoVisualizando !== null && (
        <ModalVisualizarPlano
          planoId={planoVisualizando}
          onFechar={() => setPlanoVisualizando(null)}
        />
      )}

      {planoEditando !== null && (
        <ModalEditarPlano
          planoId={planoEditando}
          onFechar={() => setPlanoEditando(null)}
        />
      )}

      {modalCriarAberto && (
        <ModalCriarPlano
          onFechar={() => setModalCriarAberto(false)}
          onCriado={() => setModalCriarAberto(false)}
        />
      )}
    </div>
  )
}
