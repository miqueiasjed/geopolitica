import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  ReloadIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'
import {
  adminKeys,
  buscarEventosSemEditorial,
  reprocessarEventosEditoriais,
  buscarStatusReprocessamento,
} from '../../services/admin'
import type { EventoSemEditorial, TipoFiltroEventoSemEditorial, ReprocessarEditorialStatus } from '../../types/admin'
import { formatarDataCurta } from '../../utils/formatters'

// ─── Barra de progresso ───────────────────────────────────────────────────────

function BarraProgresso({ status }: { status: ReprocessarEditorialStatus }) {
  return (
    <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-100">Reprocessando editoriais...</p>
        <span className="font-mono text-xs text-zinc-400">
          {status.processados}/{status.total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e1e20]">
        <div
          className="h-full rounded-full bg-[#C9B882] transition-all duration-500"
          style={{ width: `${status.percentual}%` }}
        />
      </div>

      <div className="flex gap-6 font-mono text-xs">
        <span className="text-green-400">✓ {status.sucesso} gerados</span>
        {status.erros_count > 0 && (
          <span className="text-red-400">✗ {status.erros_count} erros</span>
        )}
        {status.concluido ? (
          <span className="text-[#C9B882]">Concluído!</span>
        ) : (
          <span className="text-zinc-500">Aguardando fila...</span>
        )}
      </div>

      {status.erros.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 space-y-1">
          {status.erros.map((erro, i) => (
            <p key={i} className="font-mono text-[11px] text-red-400">{erro}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Badge de campo ───────────────────────────────────────────────────────────

function Campo({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
        ok
          ? 'bg-green-500/10 text-green-400'
          : 'bg-red-500/10 text-red-400'
      }`}
    >
      {ok ? <CheckCircledIcon className="h-3 w-3" /> : <ExclamationTriangleIcon className="h-3 w-3" />}
      {label}
    </span>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

const TIPO_LABELS: Record<TipoFiltroEventoSemEditorial, string> = {
  todos:        'Todos os pendentes',
  sem_headline: 'Sem headline / legenda',
  sem_analise:  'Sem análise IA',
  sem_resumo:   'Sem resumo',
}

export function AdminEventosSemEditorial() {
  const queryClient = useQueryClient()

  const [tipo, setTipo] = useState<TipoFiltroEventoSemEditorial>('todos')
  const [page, setPage] = useState(1)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [operacaoId, setOperacaoId] = useState<string | null>(null)

  const filtros = { tipo, page }

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.eventosSemEditorial(filtros),
    queryFn: () => buscarEventosSemEditorial(filtros),
    staleTime: 30_000,
  })

  const { data: statusReprocessamento } = useQuery({
    queryKey: ['reprocessar-editorial-status', operacaoId],
    queryFn: () => buscarStatusReprocessamento(operacaoId!),
    enabled: !!operacaoId,
    refetchInterval: (query) => query.state.data?.concluido ? false : 2000,
  })

  useEffect(() => {
    if (statusReprocessamento?.concluido) {
      queryClient.invalidateQueries({ queryKey: adminKeys.eventosSemEditorial(filtros) })
      setSelecionados(new Set())
    }
  }, [statusReprocessamento?.concluido])

  const { mutate: iniciarReprocessamento, isPending: iniciando } = useMutation({
    mutationFn: () => reprocessarEventosEditoriais(Array.from(selecionados)),
    onSuccess: (resposta) => {
      setOperacaoId(resposta.operacao_id)
    },
  })

  const eventos = data?.data ?? []
  const idsNaPagina = eventos.map((e) => e.id)
  const todosSelecionados = idsNaPagina.length > 0 && idsNaPagina.every((id) => selecionados.has(id))

  function toggleEvento(id: number) {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function toggleTodosPagina() {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (todosSelecionados) {
        idsNaPagina.forEach((id) => novo.delete(id))
      } else {
        idsNaPagina.forEach((id) => novo.add(id))
      }
      return novo
    })
  }

  function handleChangeTipo(novoTipo: TipoFiltroEventoSemEditorial) {
    setTipo(novoTipo)
    setPage(1)
    setSelecionados(new Set())
  }

  const reprocessandoAtivo = !!operacaoId && !statusReprocessamento?.concluido

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Eventos sem Editorial</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Notícias que falharam na geração de headline, análise ou resumo.
          </p>
        </div>

        {selecionados.size > 0 && !reprocessandoAtivo && (
          <button
            type="button"
            disabled={iniciando}
            onClick={() => iniciarReprocessamento()}
            className="inline-flex items-center gap-2 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {iniciando ? (
              <>
                <UpdateIcon className="h-3.5 w-3.5 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <ReloadIcon className="h-3.5 w-3.5" />
                Reprocessar {selecionados.size} selecionado{selecionados.size > 1 ? 's' : ''}
              </>
            )}
          </button>
        )}
      </div>

      {/* Progresso */}
      {statusReprocessamento && (
        <BarraProgresso status={statusReprocessamento} />
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TIPO_LABELS) as TipoFiltroEventoSemEditorial[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleChangeTipo(t)}
            className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
              tipo === t
                ? 'bg-[#C9B882]/15 text-[#C9B882] border border-[#C9B882]/30'
                : 'border border-[#1e1e20] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {TIPO_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-[#1e1e20] bg-[#0d0d0f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e20]">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={todosSelecionados}
                    onChange={toggleTodosPagina}
                    disabled={reprocessandoAtivo}
                    className="h-4 w-4 rounded border-zinc-600 bg-[#111113] accent-[#C9B882]"
                  />
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Título
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hidden md:table-cell">
                  Fonte
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hidden lg:table-cell">
                  Data
                </th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Campos
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <UpdateIcon className="mx-auto h-5 w-5 animate-spin text-zinc-600" />
                  </td>
                </tr>
              ) : eventos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <CheckCircledIcon className="mx-auto h-8 w-8 text-green-500/40" />
                    <p className="mt-3 text-sm text-zinc-500">Nenhum evento pendente neste filtro.</p>
                  </td>
                </tr>
              ) : (
                eventos.map((evento: EventoSemEditorial) => (
                  <tr
                    key={evento.id}
                    className={`border-b border-[#1a1a1c] transition-colors hover:bg-white/2 ${
                      selecionados.has(evento.id) ? 'bg-[#C9B882]/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selecionados.has(evento.id)}
                        onChange={() => toggleEvento(evento.id)}
                        disabled={reprocessandoAtivo}
                        className="h-4 w-4 rounded border-zinc-600 bg-[#111113] accent-[#C9B882]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 line-clamp-2 text-sm leading-snug">
                        {evento.titulo}
                      </p>
                      <span className={`mt-1 inline-block font-mono text-[10px] ${evento.relevante ? 'text-green-500' : 'text-zinc-600'}`}>
                        {evento.relevante ? 'relevante' : 'oculto'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-zinc-500">{evento.fonte}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-zinc-500">
                        {evento.publicado_em ? formatarDataCurta(evento.publicado_em) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Campo ok={evento.tem_headline} label="headline" />
                        <Campo ok={evento.tem_analise} label="análise" />
                        <Campo ok={evento.tem_resumo} label="resumo" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-[#1e1e20] px-4 py-3">
            <span className="font-mono text-xs text-zinc-500">
              {data.from}–{data.to} de {data.total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-[#1e1e20] px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                type="button"
                disabled={page >= data.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#1e1e20] px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {selecionados.size > 0 && !reprocessandoAtivo && (
        <p className="text-center font-mono text-xs text-zinc-500">
          {selecionados.size} selecionado{selecionados.size > 1 ? 's' : ''} — os jobs serão enfileirados com ~8s de intervalo para evitar rate limit
        </p>
      )}
    </div>
  )
}
