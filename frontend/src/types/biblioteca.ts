export type TipoConteudo = 'briefing' | 'mapa' | 'tese'
export type PlanoMinimo = 'essencial' | 'pro' | 'reservado'
export type VerticalConteudo = 'elections' | 'war'

export interface ConteudoCard {
  id: number
  tipo: TipoConteudo
  titulo: string
  slug: string
  resumo: string
  regiao: string | null
  tags: string[] | null
  tese_manchete: string | null
  publicado_em: string // ISO 8601
}

export interface Conteudo extends ConteudoCard {
  corpo: string // HTML
  plano_minimo: PlanoMinimo
  vertical_conteudo?: VerticalConteudo | null
}

export interface BibliotecaFiltros {
  q?: string
  tipo?: TipoConteudo
  regiao?: string
  de?: string
  ate?: string
}

export interface BibliotecaResponse {
  data: ConteudoCard[]
  next_cursor: number | null
}
