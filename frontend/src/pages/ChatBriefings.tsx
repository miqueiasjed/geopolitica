import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../hooks/useChat'
import { ChatInput } from '../components/chat/ChatInput'
import { ChatMessages } from '../components/chat/ChatMessages'
import { ChatLimitWarning } from '../components/chat/ChatLimitWarning'

const SUGESTOES_PERGUNTAS = [
  'Quais são os principais conflitos geopolíticos do momento?',
  'Como a tensão EUA-China afeta os mercados emergentes?',
  'Quais países têm maior risco geopolítico para investidores hoje?',
  'Como o conflito na Europa impacta os preços de energia?',
  'O que esperar das eleições nos EUA para os mercados globais?',
]

export function ChatBriefings() {
  const navigate = useNavigate()
  const {
    mensagens,
    isLoading,
    limiteAtingido,
    limiteErro,
    perguntaCount,
    limite,
    enviar,
    carregarHistorico,
  } = useChat()

  useEffect(() => {
    carregarHistorico()
  }, [carregarHistorico])

  const labelContagem = limite !== null && limite !== undefined
    ? `${perguntaCount} / ${limite} perguntas hoje`
    : `${perguntaCount} / ∞ perguntas hoje`

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Chat com os Briefings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pergunte sobre qualquer evento, país ou crise geopolítica
        </p>
      </div>

      {/* Layout principal */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        {/* Coluna principal — 70% */}
        <div className="flex min-h-[600px] flex-col gap-3 rounded-xl border border-zinc-800 bg-[#0f1117] lg:w-[70%]">
          {/* Banner de limite */}
          {limiteAtingido && limiteErro && (
            <div className="px-4 pt-4">
              <ChatLimitWarning
                mensagem={limiteErro}
                onUpgrade={() => navigate('/planos')}
              />
            </div>
          )}

          {/* Área de mensagens */}
          <ChatMessages mensagens={mensagens} isLoading={isLoading && mensagens.length === 0} />

          {/* Input */}
          <div className="border-t border-zinc-800 p-4">
            <ChatInput
              onEnviar={enviar}
              disabled={isLoading || limiteAtingido}
            />
          </div>
        </div>

        {/* Sidebar — 30% */}
        <aside className="flex flex-col gap-4 lg:w-[30%]">
          {/* Badge de contagem */}
          <div className="rounded-xl border border-zinc-800 bg-[#0f1117] p-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  limiteAtingido ? 'bg-red-500' : 'bg-green-500'
                }`}
                aria-hidden="true"
              />
              <span className="font-mono text-xs text-zinc-400">{labelContagem}</span>
            </div>

            {limite !== null && limite !== undefined && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      limiteAtingido ? 'bg-red-500' : 'bg-[#C9B882]'
                    }`}
                    style={{
                      width: `${Math.min((perguntaCount / limite) * 100, 100)}%`,
                    }}
                    role="progressbar"
                    aria-valuenow={perguntaCount}
                    aria-valuemin={0}
                    aria-valuemax={limite}
                    aria-label={`${perguntaCount} de ${limite} perguntas utilizadas`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sugestões de perguntas */}
          <div className="rounded-xl border border-zinc-800 bg-[#0f1117] p-4">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-zinc-500">
              Sugestões
            </h2>
            <ul className="flex flex-col gap-2">
              {SUGESTOES_PERGUNTAS.map((sugestao) => (
                <li key={sugestao}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoading && !limiteAtingido) {
                        enviar(sugestao)
                      }
                    }}
                    disabled={isLoading || limiteAtingido}
                    className="w-full rounded-lg border border-zinc-800 bg-transparent px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:border-[#C9B882]/20 hover:bg-[#C9B882]/5 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sugestao}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Dica de uso */}
          <div className="rounded-xl border border-zinc-800 bg-[#0f1117] p-4">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-zinc-500">
              Dicas
            </h2>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-2 text-xs text-zinc-600">
                <span className="text-[#C9B882]/50">›</span>
                Pergunte sobre países específicos, eventos ou tendências
              </li>
              <li className="flex items-start gap-2 text-xs text-zinc-600">
                <span className="text-[#C9B882]/50">›</span>
                Use Ctrl+Enter para enviar sua mensagem
              </li>
              <li className="flex items-start gap-2 text-xs text-zinc-600">
                <span className="text-[#C9B882]/50">›</span>
                O histórico do dia é salvo automaticamente
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
