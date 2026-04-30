export type TicketStatus = 'aberto' | 'respondido' | 'fechado'

export interface SuporteAnexo {
  id: number
  nome_original: string
  mime_type: string
  tamanho: number
  url: string
}

export interface SuporteMensagem {
  id: number
  corpo: string
  is_admin: boolean
  autor_nome: string
  criado_em: string
  anexos: SuporteAnexo[]
}

export interface SuporteTicket {
  id: number
  assunto: string
  status: TicketStatus
  nao_lido_admin: boolean
  usuario: {
    id: number
    nome: string
    email: string
  }
  mensagens: SuporteMensagem[]
  total_mensagens: number
  criado_em: string
  atualizado_em: string
}

export interface AbrirTicketPayload {
  assunto: string
  corpo: string
  anexos?: File[]
}

export interface ResponderTicketPayload {
  corpo: string
  anexos?: File[]
}
