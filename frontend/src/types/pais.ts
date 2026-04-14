export interface PerfilPais {
  codigo_pais: string
  nome_pt: string
  bandeira_emoji: string | null
  regiao_geopolitica: string
  contexto_geopolitico: string | null
  analise_lideranca: string | null
  indicadores_relevantes: string[]
  termos_busca: string[]
  gerado_em: string | null
}

export interface PaisResumo {
  codigo_pais: string
  nome_pt: string
  bandeira_emoji: string | null
  regiao_geopolitica: string
  gerado_em: string | null
}

export interface PaisUsuario {
  id: number
  user_id: number
  codigo_pais: string
  adicionado_em: string
  perfil: PaisResumo
}

export interface EventoPais {
  id: number
  titulo: string
  descricao: string
  nivel_tensao: string
  created_at: string
}
