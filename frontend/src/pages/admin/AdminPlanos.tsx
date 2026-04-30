import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircledIcon, Cross2Icon, Pencil1Icon } from '@radix-ui/react-icons'
import {
  fetchPlanos,
  atualizarRecurso,
  adminPlanosKeys,
} from '../../services/adminPlanos'
import type { Plano, PlanoRecursoItem } from '../../services/adminPlanos'

// ─── Labels humanizados dos recursos ─────────────────────────────────────────

const LABELS: Record<string, string> = {
  chat_diario_limite: 'Chat (por dia)',
  relatorio_mensal_limite: 'Relatórios IA (por mês)',
  feed_historico_dias: 'Histórico do Feed (dias)',
  conteudo_historico_dias: 'Conteúdo (histórico dias)',
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
  valor: string | null
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

  // Valor numérico com unidade contextual
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
  item: PlanoRecursoItem
  tipo: TipoRecurso
  onConcluir: () => void
}

function EditorRecurso({ planoId, chave, item, tipo, onConcluir }: EditorRecursoProps) {
  const queryClient = useQueryClient()

  const [valorLocal, setValorLocal] = useState<string>(item.valor ?? '')
  const [ilimitado, setIlimitado] = useState(item.valor === null)
  const [ativoLocal, setAtivoLocal] = useState(item.ativo)
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      atualizarRecurso(
        planoId,
        chave,
        tipo === 'boolean' ? (valorLocal === 'true' ? 'true' : 'false') : (ilimitado ? null : valorLocal),
        ativoLocal,
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
      {/* Campo de valor por tipo */}
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

      {/* Toggle ativo */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`ativo-${planoId}-${chave}`}
          checked={ativoLocal}
          onChange={(e) => setAtivoLocal(e.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer accent-[#C9B882]"
        />
        <label
          htmlFor={`ativo-${planoId}-${chave}`}
          className="cursor-pointer font-mono text-xs text-zinc-400"
        >
          Recurso ativo para o plano
        </label>
      </div>

      {erroLocal && (
        <p className="font-mono text-[11px] text-red-400">{erroLocal}</p>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-50"
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
  item: PlanoRecursoItem
}

function LinhaRecurso({ planoId, chave, item }: LinhaRecursoProps) {
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
          item={item}
          tipo={tipo}
          onConcluir={() => setEditando(false)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <BadgeValor valor={item.valor} chave={chave} />
          {!item.ativo && (
            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-red-400">
              Inativo
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Card de plano ────────────────────────────────────────────────────────────

interface CardPlanoProps {
  plano: Plano
}

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

function CardPlano({ plano }: CardPlanoProps) {
  const corSlug = COR_SLUG[plano.slug] ?? 'text-zinc-300'
  const bordaSlug = BORDA_SLUG[plano.slug] ?? 'border-[#1e1e20]'
  const headerSlug = HEADER_SLUG[plano.slug] ?? ''

  const totalRecursos = Object.keys(plano.recursos).length
  const recursosAtivos = Object.values(plano.recursos).filter((r) => r.ativo).length

  return (
    <div className={`flex flex-col rounded-xl border ${bordaSlug} overflow-hidden`}>
      {/* Cabeçalho do plano */}
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

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
            {recursosAtivos}/{totalRecursos} ativos
          </span>
          {!plano.ativo && (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-red-400">
              Plano inativo
            </span>
          )}
        </div>
      </div>

      {/* Lista de recursos */}
      <div className="flex flex-1 flex-col gap-2 bg-[#0a0a0b] p-4">
        {Object.entries(plano.recursos).length === 0 ? (
          <p className="py-4 text-center font-mono text-xs text-zinc-600">
            Nenhum recurso configurado
          </p>
        ) : (
          Object.entries(plano.recursos).map(([chave, item]) => (
            <LinhaRecurso
              key={chave}
              planoId={plano.id}
              chave={chave}
              item={item}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function AdminPlanos() {
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

        {!isLoading && planos && (
          <div className="flex-shrink-0 rounded-xl border border-[#1e1e20] bg-[#111113] px-4 py-3 text-center">
            <p className="font-mono text-xl font-semibold text-white">{planos.length}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              planos
            </p>
          </div>
        )}
      </div>

      {/* Estado de carregamento */}
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

      {/* Estado de erro */}
      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
          Não foi possível carregar os planos. Verifique a conexão e tente novamente.
        </div>
      )}

      {/* Grade de planos */}
      {planosOrdenados.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {planosOrdenados.map((plano) => (
            <CardPlano key={plano.id} plano={plano} />
          ))}
        </div>
      )}
    </div>
  )
}
