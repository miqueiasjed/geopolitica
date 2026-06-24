export interface Automacao {
  chave: string
  grupo: string
  label: string
  descricao: string | null
  ativa: boolean
}

export type GruposAutomacao = Record<string, Automacao[]>

export interface AutomacoesResponse {
  data: GruposAutomacao
  grupos: Record<string, string>
}
