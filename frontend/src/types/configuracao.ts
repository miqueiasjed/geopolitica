export type TipoConfiguracao = 'texto' | 'senha' | 'numero' | 'select' | 'textarea'

export type GrupoConfiguracao = 'ia' | 'email' | 'pagamentos' | 'seguranca' | 'alertas' | 'geral' | 'prompts'

export interface Configuracao {
  chave: string
  label: string
  descricao: string | null
  grupo: GrupoConfiguracao
  tipo: TipoConfiguracao
  opcoes?: string[] | null
  sensivel: boolean
  configurado: boolean
  valor: string | null
}

export type GruposConfiguracao = Partial<Record<GrupoConfiguracao, Configuracao[]>>

export interface ConfiguracoesResponse {
  data: GruposConfiguracao
}
