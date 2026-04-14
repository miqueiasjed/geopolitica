import ReactMarkdown from 'react-markdown'
import type { ChatMensagem } from '../../types/chat'

interface ChatMessageProps {
  mensagem: ChatMensagem
}

function formatarHorario(isoString?: string): string {
  if (!isoString) return ''
  try {
    const data = new Date(isoString)
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function AvatarUser() {
  return (
    <div
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2A2F3A] text-zinc-300"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  )
}

function AvatarAssistente() {
  return (
    <div
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#C9B882]/30 bg-[#1C1F26] text-[#C9B882]"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </div>
  )
}

export function ChatMessage({ mensagem }: ChatMessageProps) {
  const isUser = mensagem.role === 'user'
  const horario = formatarHorario(mensagem.created_at)

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="flex max-w-[75%] flex-col items-end gap-1">
          <div className="rounded-2xl rounded-br-sm bg-[#2A2F3A] px-4 py-2.5 text-sm text-zinc-200">
            <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          </div>
          {horario && (
            <span className="font-mono text-[10px] text-zinc-600">{horario}</span>
          )}
        </div>
        <AvatarUser />
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <AvatarAssistente />
      <div className="flex max-w-[80%] flex-col gap-1">
        <div className="rounded-2xl rounded-bl-sm border border-[#C9B882]/30 bg-[#1C1F26] px-4 py-2.5 text-sm text-zinc-200">
          {mensagem.conteudo || mensagem.streaming ? (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0a0a0b] prose-pre:border prose-pre:border-zinc-700 prose-code:text-[#C9B882] prose-code:before:content-none prose-code:after:content-none">
              {mensagem.conteudo ? (
                <ReactMarkdown>{mensagem.conteudo}</ReactMarkdown>
              ) : null}
              {mensagem.streaming && (
                <span
                  className="inline-block animate-pulse text-[#C9B882]"
                  aria-label="Digitando..."
                >
                  ▋
                </span>
              )}
            </div>
          ) : null}
        </div>
        {horario && (
          <span className="font-mono text-[10px] text-zinc-600">{horario}</span>
        )}
      </div>
    </div>
  )
}
