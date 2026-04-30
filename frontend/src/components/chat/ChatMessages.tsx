import { useEffect, useRef } from 'react'
import type { ChatMensagem } from '../../types/chat'
import { ChatMessage } from './ChatMessage'

interface ChatMessagesProps {
  mensagens: ChatMensagem[]
  isLoading: boolean
}

function SkeletonMensagem({ align }: { align: 'left' | 'right' }) {
  const isRight = align === 'right'
  return (
    <div className={`flex items-end gap-2 ${isRight ? 'justify-end' : ''}`}>
      {!isRight && (
        <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full bg-zinc-800" />
      )}
      <div
        className={`h-12 w-48 animate-pulse rounded-2xl bg-zinc-800 ${
          isRight ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
      />
      {isRight && (
        <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full bg-zinc-800" />
      )}
    </div>
  )
}

export function ChatMessages({ mensagens, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  if (isLoading && mensagens.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        aria-live="polite"
        aria-label="Carregando histórico de mensagens"
      >
        <SkeletonMensagem align="right" />
        <SkeletonMensagem align="left" />
      </div>
    )
  }

  if (mensagens.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
        aria-label="Nenhuma mensagem ainda"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#BFFF3C]/20 bg-[#1C1F26] text-[#BFFF3C]/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Faça sua primeira pergunta sobre geopolítica
          </p>
          <p className="mt-1 font-mono text-[11px] text-zinc-600">
            Pressione Ctrl+Enter para enviar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
      aria-live="polite"
      aria-label="Conversa com o assistente"
    >
      {mensagens.map((mensagem, index) => (
        <ChatMessage
          key={mensagem.id ?? `msg-${index}`}
          mensagem={mensagem}
        />
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
