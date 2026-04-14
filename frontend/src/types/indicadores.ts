export interface Indicador {
  id: number
  simbolo: string
  nome: string
  valor: number | null
  moeda: 'USD' | 'BRL'
  unidade: string
  variacao_pct: number | null
  variacao_abs: number | null
  atualizado_em: string | null
}

export interface IndicadorHistoricoItem {
  valor: number
  registrado_em: string
}

export interface IndicadorHistoricoResponse {
  simbolo: string
  historico: IndicadorHistoricoItem[]
}
