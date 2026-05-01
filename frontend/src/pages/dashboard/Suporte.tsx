import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ChatBubbleIcon,
  ChevronLeftIcon,
  Cross2Icon,
  FileTextIcon,
  PaperPlaneIcon,
  PlusIcon,
} from '@radix-ui/react-icons'
import {
  abrirTicket,
  buscarMeusTickets,
  buscarTicket,
  responderTicket,
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

function NovoTicketModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')
  const [arquivos, setArquivos] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: () => abrirTicket({ assunto, corpo, anexos: arquivos }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: suporteKeys.tickets() })
      onClose()
    },
  })

  const removerArquivo = (i: number) => setArquivos((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-lg rounded-2xl border border-[#2a2a2d] bg-[#111113] p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#C9B882]">
            Novo Ticket
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            <Cross2Icon />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Assunto
            </label>
            <input
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Descreva brevemente seu problema..."
              className="w-full rounded-lg border border-[#2a2a2d] bg-[#0d0d0f] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-[#BFFF3C]/40 focus:ring-1 focus:ring-[#BFFF3C]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Mensagem
            </label>
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={5}
              placeholder="Explique sua dúvida ou problema em detalhes..."
              className="w-full resize-none rounded-lg border border-[#2a2a2d] bg-[#0d0d0f] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-[#BFFF3C]/40 focus:ring-1 focus:ring-[#BFFF3C]/20"
            />
          </div>

          <div>
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
              className="flex items-center gap-2 rounded-md border border-[#2a2a2d] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:border-[#BFFF3C]/30 hover:text-zinc-200"
            >
              <FileTextIcon className="h-3.5 w-3.5" />
              Anexar arquivo
            </button>
            {arquivos.length > 0 && (
              <ul className="mt-2 space-y-1">
                {arquivos.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-md border border-[#2a2a2d] bg-[#0d0d0f] px-3 py-1.5 text-xs text-zinc-400"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removerArquivo(i)}
                      className="ml-3 shrink-0 text-zinc-600 hover:text-zinc-300"
                    >
                      <Cross2Icon className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {mutation.isError && (
          <p className="mt-3 text-xs text-red-400">Erro ao enviar. Tente novamente.</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#2a2a2d] px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!assunto.trim() || !corpo.trim() || mutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#D7FF69] transition-colors hover:bg-[#BFFF3C]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PaperPlaneIcon />
            {mutation.isPending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ThreadView({ ticket }: { ticket: SuporteTicket; onVoltar: () => void }) {
  const qc = useQueryClient()
  const [corpo, setCorpo] = useState('')
  const [arquivos, setArquivos] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const prefersReduced = useReducedMotion()

  const { data: ticketDetalhe } = useQuery({
    queryKey: suporteKeys.ticket(ticket.id),
    queryFn: () => buscarTicket(ticket.id),
    initialData: ticket,
  })

  const mutation = useMutation({
    mutationFn: () => responderTicket(ticket.id, { corpo, anexos: arquivos }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: suporteKeys.ticket(ticket.id) })
      qc.invalidateQueries({ queryKey: suporteKeys.tickets() })
      setCorpo('')
      setArquivos([])
    },
  })

  const isFechado = ticketDetalhe?.status === 'fechado'

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        {(ticketDetalhe?.mensagens ?? []).map((msg) => (
          <motion.div
            key={msg.id}
            className={`rounded-xl border p-4 ${
              msg.is_admin
                ? 'border-cyan-400/20 bg-cyan-900/10 ml-6'
                : 'border-[#2a2a2d] bg-[#111113]'
            }`}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`font-mono text-[11px] font-bold uppercase tracking-[0.16em] ${msg.is_admin ? 'text-cyan-300' : 'text-[#C9B882]'}`}>
                {msg.is_admin ? 'Suporte' : msg.autor_nome}
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
                      <img src={anexo.url} alt={anexo.nome_original} className="h-4 w-4 rounded object-cover" />
                    ) : (
                      <FileTextIcon className="h-3.5 w-3.5" />
                    )}
                    <span className="max-w-[140px] truncate">{anexo.nome_original}</span>
                    <span className="text-zinc-600">{formatarTamanho(anexo.tamanho)}</span>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {!isFechado && (
        <div className="rounded-xl border border-[#2a2a2d] bg-[#111113] p-4">
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={3}
            placeholder="Escreva sua resposta..."
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
            </div>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!corpo.trim() || mutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[#D7FF69] transition-colors hover:bg-[#BFFF3C]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PaperPlaneIcon />
              {mutation.isPending ? 'Enviando...' : 'Responder'}
            </button>
          </div>
        </div>
      )}

      {isFechado && (
        <div className="rounded-xl border border-zinc-700/30 bg-zinc-800/20 p-4 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Este ticket está fechado
          </p>
        </div>
      )}
    </div>
  )
}

export function Suporte() {
  const prefersReduced = useReducedMotion()
  const [novoTicketAberto, setNovoTicketAberto] = useState(false)
  const [ticketSelecionado, setTicketSelecionado] = useState<SuporteTicket | null>(null)

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: suporteKeys.tickets(),
    queryFn: buscarMeusTickets,
  })

  return (
    <>
      <AnimatePresence>
        {novoTicketAberto && (
          <NovoTicketModal onClose={() => setNovoTicketAberto(false)} />
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#BFFF3C]/60">
              Central
            </p>
            <h1 className="mt-1 text-2xl font-black text-white">Suporte</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Envie suas dúvidas ou problemas. Nossa equipe responderá em breve.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNovoTicketAberto(true)}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-[#BFFF3C]/30 bg-[#BFFF3C]/10 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.16em] text-[#D7FF69] transition-colors hover:bg-[#BFFF3C]/20"
          >
            <PlusIcon />
            Novo Ticket
          </button>
        </div>

        {ticketSelecionado ? (
          <motion.div
            key="thread"
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-4 rounded-xl border border-[#2a2a2d] bg-[#111113] p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTicketSelecionado(null)}
                  className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-zinc-200"
                >
                  <ChevronLeftIcon />
                  Voltar
                </button>
                <span className="text-zinc-700">·</span>
                <span className="flex-1 truncate text-sm font-semibold text-zinc-100">
                  {ticketSelecionado.assunto}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${statusColor[ticketSelecionado.status]}`}
                >
                  {statusLabel[ticketSelecionado.status]}
                </span>
              </div>
            </div>
            <ThreadView ticket={ticketSelecionado} onVoltar={() => setTicketSelecionado(null)} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={prefersReduced ? undefined : { opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-[#1e1e20] bg-[#111113]"
                  />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#2a2a2d] bg-[#111113]/50 py-20 text-center">
                <ChatBubbleIcon className="mb-4 h-10 w-10 text-zinc-700" />
                <p className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Nenhum ticket ainda
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                  Clique em "Novo Ticket" para enviar sua primeira mensagem.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setTicketSelecionado(ticket)}
                    className="group w-full rounded-xl border border-[#2a2a2d] bg-[#111113] p-4 text-left transition-all hover:border-[#BFFF3C]/20 hover:bg-[#111113]/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
                          {ticket.assunto}
                        </p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          {formatarData(ticket.criado_em)} · {ticket.total_mensagens} mensagem(s)
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
      </div>
    </>
  )
}
