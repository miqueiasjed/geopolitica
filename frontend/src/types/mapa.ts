export interface PaisIntensidade {
  codigo_pais: string       // ISO alpha-2: "BR", "US"
  nome_pais: string
  intensidade_final: number // 1–10
}

export interface MapaData {
  paises: PaisIntensidade[]
}
