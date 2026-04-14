import { useRef, useState, useCallback, useEffect } from 'react'

interface ChatInputProps {
  onEnviar: (texto: string) => void
  disabled: boolean
}

const LIMITE_CARACTERES = 500

export function ChatInput({ onEnviar, disabled }: ChatInputProps) {
  const [texto, setTexto] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const ajustarAltura = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const linhaAltura = 24
    const maxAltura = linhaAltura * 5 + 16 // 5 linhas + padding
    el.style.height = `${Math.min(el.scrollHeight, maxAltura)}px`
  }, [])

  useEffect(() => {
    ajustarAltura()
  }, [texto, ajustarAltura])

  const handleEnviar = useCallback(() => {
    const trimmed = texto.trim()
    if (!trimmed || disabled || trimmed.length > LIMITE_CARACTERES) return
    onEnviar(trimmed)
    setTexto('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [texto, disabled, onEnviar])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        handleEnviar()
      }
    },
    [handleEnviar],
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTexto(e.target.value)
  }, [])

  const excedeLimite = texto.length > LIMITE_CARACTERES

  return (
    <div className="relative flex flex-col gap-2 rounded-xl border border-[#C9B882]/20 bg-[#1C1F26] p-3">
      <textarea
        ref={textareaRef}
        value={texto}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Faça uma pergunta sobre geopolítica..."
        rows={1}
        className="w-full resize-none bg-transparent pr-12 text-sm text-zinc-200 placeholder-zinc-600 outline-none disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: '40px', maxHeight: '136px' }}
        aria-label="Mensagem para o assistente"
      />

      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-[11px] tabular-nums ${
            excedeLimite ? 'text-red-400' : 'text-zinc-600'
          }`}
        >
          {texto.length} / {LIMITE_CARACTERES}
        </span>

        <button
          type="button"
          onClick={handleEnviar}
          disabled={disabled || !texto.trim() || excedeLimite}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9B882] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#0a0a0b] transition-all hover:bg-[#D4C99A] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Enviar mensagem (Ctrl+Enter)"
        >
          {disabled ? (
            <svg
              className="h-3.5 w-3.5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
          Enviar
        </button>
      </div>

      {!disabled && (
        <p className="font-mono text-[10px] text-zinc-700">
          Ctrl+Enter para enviar · Enter para nova linha
        </p>
      )}
    </div>
  )
}
