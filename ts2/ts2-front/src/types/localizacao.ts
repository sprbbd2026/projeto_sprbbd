export interface Localizacao {
  id: number
  satelite_id: string
  latitude: number
  longitude: number
  altitude_km?: number
  velocidade_kmh?: number
  data_hora: string
}

export interface HistoricoLocalizacaoParams {
  satelite_id: string
  data_inicio?: string
  data_fim?: string
  limit?: number
}

export interface RotaCoordenada {
  latitude: number
  longitude: number
  data_hora: string
}

export interface RotaResponse {
  satelite_id: string
  rota: RotaCoordenada[]
  gerado_automaticamente?: boolean
}
