export type RelevanciaEleicao = 'alta' | 'media' | 'baixa'

export interface CandidatoPrincipal {
  nome: string
  partido?: string
}

export interface Eleicao {
  id: number
  pais: string
  codigo_pais: string
  data_eleicao: string
  tipo_eleicao: string
  relevancia: RelevanciaEleicao
}

export interface EleicaoDetalhe extends Eleicao {
  contexto_geopolitico: string
  impacto_brasil: string
  candidatos_principais: CandidatoPrincipal[]
  content_slug: string | null
  created_at: string
  updated_at: string
}

export interface FiltrosEleicao {
  ano: number
  relevancia?: RelevanciaEleicao
}

// Mapa de cores por relevância
export const CORES_RELEVANCIA: Record<RelevanciaEleicao, string> = {
  alta: '#EF4444',
  media: '#FACC15',
  baixa: 'rgba(232, 228, 220, 0.2)',
}
