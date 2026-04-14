import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { buscarHistorico, enviarPergunta } from '../services/chatApi'
import type { ChatMensagem } from '../types/chat'

export function useChat() {
  const { token } = useAuth()

  const [mensagens, setMensagens] = useState<ChatMensagem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [limiteAtingido, setLimiteAtingido] = useState(false)
  const [limiteErro, setLimiteErro] = useState<string | null>(null)
  const [perguntaCount, setPerguntaCount] = useState(0)
  const [limite, setLimite] = useState<number | null>(null)

  const carregarHistorico = useCallback(async () => {
    try {
      const historico = await buscarHistorico()
      setMensagens(historico.mensagens)
      setPerguntaCount(historico.pergunta_count)
      setLimite(historico.limite)
    } catch {
      // Falha silenciosa ao carregar histórico
    }
  }, [])

  const enviar = useCallback(
    async (pergunta: string) => {
      if (isLoading || limiteAtingido) return

      setIsLoading(true)
      setLimiteErro(null)

      // 1. Adicionar mensagem do usuário
      const mensagemUsuario: ChatMensagem = {
        role: 'user',
        conteudo: pergunta,
      }

      // 2. Adicionar placeholder do assistente em streaming
      const placeholderAssistente: ChatMensagem = {
        role: 'assistant',
        conteudo: '',
        streaming: true,
      }

      setMensagens((prev) => [...prev, mensagemUsuario, placeholderAssistente])

      try {
        const gerador = enviarPergunta(pergunta, token ?? undefined)

        // 3. Iterar tokens e concatenar ao conteúdo da última mensagem
        for await (const tokenChunk of gerador) {
          setMensagens((prev) => {
            const atualizado = [...prev]
            const ultima = atualizado[atualizado.length - 1]
            if (ultima && ultima.role === 'assistant') {
              atualizado[atualizado.length - 1] = {
                ...ultima,
                conteudo: ultima.conteudo + tokenChunk,
              }
            }
            return atualizado
          })
        }

        // 4. Finalizar streaming
        setMensagens((prev) => {
          const atualizado = [...prev]
          const ultima = atualizado[atualizado.length - 1]
          if (ultima && ultima.role === 'assistant') {
            atualizado[atualizado.length - 1] = {
              ...ultima,
              streaming: false,
            }
          }
          return atualizado
        })

        setPerguntaCount((prev) => prev + 1)
      } catch (erro) {
        // 5. Tratar erro 429
        const erroComUpgrade = erro as Error & { upgrade?: boolean }
        if (erroComUpgrade.upgrade) {
          setLimiteAtingido(true)
          setLimiteErro(erroComUpgrade.message)
        }

        // Remover placeholder em caso de erro
        setMensagens((prev) => {
          const atualizado = [...prev]
          const ultima = atualizado[atualizado.length - 1]
          if (ultima && ultima.role === 'assistant' && ultima.streaming) {
            atualizado.pop()
          }
          return atualizado
        })
      } finally {
        // 6. Finalizar loading
        setIsLoading(false)
      }
    },
    [isLoading, limiteAtingido, token],
  )

  return {
    mensagens,
    isLoading,
    limiteAtingido,
    limiteErro,
    perguntaCount,
    limite,
    enviar,
    carregarHistorico,
  }
}
