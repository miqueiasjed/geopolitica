import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeftIcon,
  Cross2Icon,
  FileTextIcon,
  LockClosedIcon,
  PaperPlaneIcon,
} from '@radix-ui/react-icons'
import {
  buscarAdminTicket,
  buscarAdminTickets,
  fecharTicket,
  responderAdminTicket,
  suporteKeys,
} from '../../services/suporteApi'
import type { SuporteTicket, TicketStatus } from '../../types/suporte'

const statusLabel: Record<TicketStatus, string> = {
  aberto: 'Aberto',
  respondido: 'Respondido',
  fechado: 'Fechado',
}

const statusColor: Record<TicketStatus, string> = {
  aberto: 'border-[#BFFF3C]/30 text-[#D7FF69] bg-[#BFFF3C]/10',
  respondido: 'border-cyan-400/30 text-cyan-300 bg-cyan-400/10',
  fechado: 'border-zinc-600/30 text-zinc-500 bg-zinc-800/40',
}

function formatarData(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImagem(mime: string) {
  return mime.startsWith('image/')
}

type FiltroStatus = TicketStatus | 'todos'

const filtros: { label: string; value: FiltroStatus }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Abertos', value: 'aberto' },
  { label: 'Respondidos', value: 'respondido' },
  { label: 'Fechados', value: 'fechado' },
]

function ThreadAdmin({ ticket, onVoltar }: { ticket: SuporteTicket; onVoltar: () => void }) {
  const qc = useQueryClient()
  const [corpo, setCorpo] = useState('')
  const [arquivos, setArquivos] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: ticketDetalhe } = useQuery({
    queryKey: suporteKeys.adminTicket(ticket.id),
    queryFn: () => buscarAdminTicket(ticket.id),
    initialData: ticket,
  })

  const mutationResponder = useMutation({
    mutationFn: () => responderAdminTicket(ticket.id, { corpo, anexos: arquivos }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: suporteKeys.adminTicket(ticket.id) })
      qc.invalidateQueries({ queryKey: suporteKeys.adminTickets() })
      setCorpo('')
      setArquivos([])
    },
  })

  const mutationFechar = useMutation({
    mutationFn: () => fecharTicket(ticket.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: suporteKeys.adminTicket(ticket.id) })
      qc.invalidateQueries({ queryKey: suporteKeys.adminTickets() })
    },
  })

  const isFechado = ticketDetalhe?.status === 'fechado'

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2a2a2d] bg-[#111113] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <ChevronLeftIcon />
            Inbox
          </button>
          <span className="text-zinc-700">·</span>
          <span className="flex-1 truncate text-sm font-semibold text-zinc-100">
            {ticketDetalhe?.assunto}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${statusColor[ticketDetalhe?.status ?? 'aberto']}`}
            >
              {statusLabel[ticketDetalhe?.status ?? 'aberto']}
            </span>
            {!isFechado && (
              <button
                type="button"
                onClick={() => mutationFechar.mutate()}
                disabled={mutationFechar.isPending}
                className="flex items-center gap-1.5 rounded-md border border-zinc-700/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-40"
              >
                <LockClosedIcon className="h-3 w-3" />
                Fechar
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          De: {ticketDetalhe?.usuario.nome} · {ticketDetalhe?.usuario.email}
        </p>
      </div>

      <div className="space-y-3">
        {ticketDetalhe?.mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border p-4 ${
              msg.is_admin
                ? 'ml-6 border-cyan-400/20 bg-cyan-900/10'
                : 'border-[#2a2a2d] bg-[#111113]'
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className={`font-mono text-[11px] font-bold uppercase tracking-[0.16em] ${msg.is_admin ? 'text-cyan-300' : 'text-[#C9B882]'}`}
              >
                {msg.is_admin ? 'Suporte (você)' : msg.autor_nome}
              </span>
              <span className="font-mono text-[10px] text-zinc-600">
                {formatarData(msg.criado_em)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{msg.corpo}</p>

            {msg.anexos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.anexos.map((anexo) => (
                  <a
                    key={anexo.id}
                    href={anexo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-[#2a2a2d] bg-[#0d0d0f] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-[#BFFF3C]/30 hover:text-zinc-200"
                  >
                    {isImagem(anexo.mime_type) ? (
                      <img
                        src={anexo.url}
                        alt={anexo.nome_original}
                        className="h-4 w-4 rounded object-cover"
                      />
                    ) : (
                      <FileTextIcon className="h-3.5 w-3.5" />
                    )}
                    <span className="max-w-[140px] truncate">{anexo.nome_original}</span>
                    <span className="text-zinc-600">{formatarTamanho(anexo.tamanho)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isFechado && (
        <div className="rounded-xl border border-[#2a2a2d] bg-[#111113] p-4">
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={4}
            placeholder="Escreva sua resposta para o usuário..."
            className="w-full resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const novos = Array.from(e.target.files ?? [])
                  setArquivos((prev) => [...prev, ...novos].slice(0, 5))
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <FileTextIcon className="h-3.5 w-3.5" />
                {arquivos.length > 0 ? `${arquivos.length} arquivo(s)` : 'Anexar'}
              </button>
              {arquivos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setArquivos([])}
                  className="text-zinc-600 hover:text-zinc-400"
                >
                  <Cross2Icon className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => mutationResponder.mutate()}
              disabled={!corpo.trim() || mutationResponder.isPending}
              className="flex items-center gap-2 rounded-lg border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#D7FF69] transition-colors hover:bg-[#BFFF3C]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PaperPlaneIcon />
              {mutationResponder.isPending ? 'Enviando...' : 'Responder'}
            </button>
          </div>
          {mutationResponder.isError && (
            <p className="mt-2 text-xs text-red-400">Erro ao enviar. Tente novamente.</p>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminSuporte() {
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroStatus>('todos')
  const [ticketSelecionado, setTicketSelecionado] = useState<SuporteTicket | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: suporteKeys.adminTickets(filtroAtivo === 'todos' ? undefined : filtroAtivo),
    queryFn: () => buscarAdminTickets(filtroAtivo === 'todos' ? undefined : filtroAtivo),
  })

  const tickets = (data as any)?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#C9B882]/60">Admin</p>
        <h1 className="mt-0.5 text-xl font-semibold text-zinc-100">Suporte — Inbox</h1>
      </div>

      <AnimatePresence mode="wait">
        {ticketSelecionado ? (
          <motion.div
            key="thread"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <ThreadAdmin
              ticket={ticketSelecionado}
              onVoltar={() => setTicketSelecionado(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex gap-1">
              {filtros.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFiltroAtivo(f.value)}
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    filtroAtivo === f.value
                      ? 'bg-[#C9B882]/10 text-[#C9B882]'
                      : 'text-zinc-500 hover:bg-white/4 hover:text-zinc-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-[#1e1e20] bg-[#111113]"
                  />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-[#2a2a2d] bg-[#111113] py-16 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
                  Nenhum ticket encontrado
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket: SuporteTicket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setTicketSelecionado(ticket)}
                    className="group w-full rounded-xl border border-[#2a2a2d] bg-[#111113] p-4 text-left transition-all hover:border-[#C9B882]/20 hover:bg-[#1a1a1c]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {ticket.nao_lido_admin && ticket.status !== 'fechado' && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#BFFF3C]" />
                          )}
                          <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
                            {ticket.assunto}
                          </p>
                        </div>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                          {ticket.usuario.nome} · {ticket.usuario.email}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                          {formatarData(ticket.atualizado_em)} · {ticket.total_mensagens} mensagem(s)
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${statusColor[ticket.status]}`}
                      >
                        {statusLabel[ticket.status]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
