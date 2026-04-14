export type CategoriaCrise =
  | 'guerra'
  | 'humanitária'
  | 'econômica'
  | 'financeira'
  | 'geopolítica'
  | 'terrorismo'
  | 'petróleo'
  | 'logística'
  | 'naval'
  | 'energética'
  | 'transição'

export interface MetricaTimeline {
  label: string
  valor: string
}

export interface CriseHistorica {
  id: number
  titulo: string
  slug: string
  ano: number
  data_inicio: string
  data_fim: string | null // null = em andamento
  categorias: CategoriaCrise[]
  content_slug: string | null
}

export interface CriseHistoricaDetalhe extends CriseHistorica {
  contexto_geopolitico: string
  impacto_global: string
  impacto_brasil: string
  metricas_globais: MetricaTimeline[]
  metricas_brasil: MetricaTimeline[]
}

export interface EventoTimeline {
  id: number
  titulo: string
  nivel_tensao: string
  created_at: string
}

export interface TimelineData {
  crises: CriseHistorica[]
  eventos: EventoTimeline[]
}

export interface FiltrosTimeline {
  periodo_inicio?: number
  periodo_fim?: number
  categoria?: CategoriaCrise
}
