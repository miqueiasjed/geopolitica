import api from '../lib/axios'
import { obterTokenAutenticacao } from '../utils/storage'
import type { ChatHistorico, ChatLimiteErro } from '../types/chat'

export async function buscarHistorico(): Promise<ChatHistorico> {
  const resposta = await api.get<ChatHistorico>('/chat/historico')
  return resposta.data
}

export async function* enviarPergunta(
  pergunta: string,
  token?: string,
): AsyncGenerator<string> {
  const authToken = token ?? obterTokenAutenticacao()

  const response = await fetch('/api/chat/perguntar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken ? `Bearer ${authToken}` : '',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ pergunta }),
  })

  if (response.status === 429) {
    const erro: ChatLimiteErro = await response.json()
    throw Object.assign(new Error(erro.message), { upgrade: true })
  }

  if (!response.ok) {
    throw new Error(`Erro ao enviar pergunta: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)

    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        const parsed = JSON.parse(data) as { token: string }
        yield parsed.token
      }
    }
  }
}
