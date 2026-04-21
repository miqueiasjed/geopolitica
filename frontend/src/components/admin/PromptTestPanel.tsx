import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useTestarPrompt } from '../../hooks/useTestarPrompt'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PromptTestPanelProps {
  promptSistema: string
  exigeJson?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tentarParsearJson(texto: string): boolean {
  try {
    JSON.parse(texto)
    return true
  } catch {
    return false
  }
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PromptTestPanel({ promptSistema, exigeJson = false }: PromptTestPanelProps) {
  const prefersReduced = useReducedMotion()
  const [expandido, setExpandido] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const { mutate, isPending, data: resultado, error, reset } = useTestarPrompt()

  function handleExecutar() {
    if (!mensagem.trim() || isPending) return
    mutate({
      prompt_sistema: promptSistema,
      mensagem_usuario: mensagem.trim(),
    })
  }

  function handleToggle() {
    setExpandido((v) => !v)
    if (expandido) {
      reset()
    }
  }

  const jsonValido = resultado ? tentarParsearJson(resultado.resposta) : null

  // ── Variantes de animação ──────────────────────────────────────────────────
  const panelVariants: Variants = {
    hidden: {
      opacity: prefersReduced ? 1 : 0,
      height: 0,
    },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: prefersReduced ? 0 : 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: prefersReduced ? 1 : 0,
      height: 0,
      transition: {
        duration: prefersReduced ? 0 : 0.2,
        ease: 'easeIn',
      },
    },
  }

  return (
    <div className="mt-3">
      {/* Toggle */}
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#C9B882]/60 transition-colors hover:text-[#C9B882] focus:outline-none"
        aria-expanded={expandido}
      >
        <motion.span
          animate={{ rotate: expandido ? 90 : 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeInOut' }}
          className="inline-block"
          aria-hidden="true"
        >
          ▶
        </motion.span>
        Testar este prompt
      </button>

      {/* Painel colapsável */}
      <AnimatePresence initial={false}>
        {expandido && (
          <motion.div
            key="prompt-test-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-lg border border-[#2a2a2e] bg-[#0d0d0f] p-4 space-y-4">

              {/* Textarea de mensagem */}
              <div className="space-y-1.5">
                <label
                  htmlFor="prompt-test-mensagem"
                  className="text-xs font-medium text-zinc-400"
                >
                  Mensagem de teste
                </label>
                <textarea
                  id="prompt-test-mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Ex: Analise o conflito Rússia-Ucrânia"
                  rows={3}
                  disabled={isPending}
                  className="w-full rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-[#C9B882]/40 focus:ring-1 focus:ring-[#C9B882]/20 resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Botão Executar */}
              <button
                type="button"
                onClick={handleExecutar}
                disabled={!mensagem.trim() || isPending}
                className="inline-flex items-center gap-2 rounded-full border border-[#C9B882]/30 bg-[#C9B882]/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-[#C9B882] transition-colors hover:bg-[#C9B882]/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending && <Spinner />}
                {isPending ? 'Executando...' : 'Executar'}
              </button>

              {/* Erro */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error-msg"
                    initial={prefersReduced ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                    role="alert"
                  >
                    {error.message || 'Erro ao executar o prompt. Tente novamente.'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Resultado */}
              <AnimatePresence>
                {resultado && (
                  <motion.div
                    key="resultado"
                    initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: prefersReduced ? 0 : 0.3, ease: 'easeOut' }}
                    className="space-y-3"
                  >
                    {/* Resposta da IA */}
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                        Resposta
                      </p>
                      <pre className="max-h-[200px] overflow-y-auto rounded-lg border border-[#2a2a2e] bg-[#111113] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap break-words">
                        {resultado.resposta}
                      </pre>
                    </div>

                    {/* Linha de metadados */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
                        {resultado.provider}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {resultado.modelo}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        · {resultado.duracao_ms}ms
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        · ~{resultado.tokens_estimados_entrada}↑ {resultado.tokens_estimados_saida}↓ tokens
                      </span>

                      {/* Badge JSON (apenas se exigeJson=true) */}
                      {exigeJson && jsonValido !== null && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                            jsonValido
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                          role="status"
                          aria-label={jsonValido ? 'JSON válido' : 'JSON inválido'}
                        >
                          {jsonValido ? '✓ JSON válido' : '✗ JSON inválido'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
