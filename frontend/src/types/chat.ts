export type RoleMensagem = 'user' | 'assistant'

export interface ChatMensagem {
  id?: number
  role: RoleMensagem
  conteudo: string
  created_at?: string
  streaming?: boolean // true enquanto token chega
}

export interface ChatHistorico {
  mensagens: ChatMensagem[]
  pergunta_count: number
  limite: number | null // null = sem limite
}

export interface ChatLimiteErro {
  message: string
  upgrade: boolean
}
