export type ImpactLabel = 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'MONITORAR'

export interface Event {
  id: number
  titulo: string
  resumo: string
  analise_ia: string | null
  fonte: string
  fonte_url?: string | null
  regiao: string | null
  impact_score: number
  impact_label: ImpactLabel
  categorias: string[]
  publicado_em: string | null
}

export interface FeedFilters {
  categoria?: string
  regiao?: string
  label?: ImpactLabel
}

export interface Editorial {
  headline: string
  legenda: string
}

export interface FeedPage {
  data: Event[]
  links: {
    next_cursor: string | null
    prev_cursor: string | null
  }
  meta: {
    path: string
    per_page: number
  }
}
