export type NivelAlerta = 'medium' | 'high' | 'critical'

export interface ResumoSinal {
  titulo: string
  tipo: 'military' | 'diplomatic' | 'supply'
}

export interface Alerta {
  id: number
  nivel: NivelAlerta
  regiao: string
  titulo: string
  analise: string
  resumo_sinais: ResumoSinal[]
  tipos_padrao: string[]
  peso_total: number
  created_at: string
}

export interface AlertasResponse {
  alertas: Alerta[]
  total_nao_lidos: number
}
