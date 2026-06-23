import { api } from './api'
import { ts1Api } from './ts1Api'
import type { Localizacao, HistoricoLocalizacaoParams } from '../types/localizacao'

interface Ts1LocationRow {
  tlm_id: number
  sat_id: number
  timestamp: string
  position: {
    lat: number
    lng: number
    alt_km: number
    velocidade_kmh?: number | null
  } | null
}

interface Ts1LocationPage {
  data: Ts1LocationRow[]
}

export const localizacaoService = {
  /**
   * Busca o histórico de localização de um satélite (US302).
   */
  async getHistorico(params: HistoricoLocalizacaoParams): Promise<Localizacao[]> {
    const { data } = await api.get<Localizacao[]>('/historico/localizacao', { params })
    return data
  },

  /**
   * Busca histórico de localização direto do ts1-back (telemetria propagada).
   */
  async getHistoricoTs1(params: HistoricoLocalizacaoParams): Promise<Localizacao[]> {
    const query = {
      sat_id: Number(params.satelite_id),
      from: params.data_inicio,
      to: params.data_fim,
      limit: params.limit ?? 10,
      offset: 0,
    }

    const { data } = await ts1Api.get<Ts1LocationPage>('/telemetria/locations', {
      params: query,
    })

    return data.data
      .filter((item) => item.position !== null)
      .map((item) => ({
        id: item.tlm_id,
        satelite_id: String(item.sat_id),
        latitude: item.position!.lat,
        longitude: item.position!.lng,
        altitude_km: item.position!.alt_km,
        velocidade_kmh: item.position!.velocidade_kmh ?? undefined,
        data_hora: item.timestamp,
      }))
  },

  /**
   * Busca a rota completa de um satélite (US300).
   */
  async getRota(satelite_id: string, limit = 200): Promise<Localizacao[]> {
    const { data } = await api.get<Localizacao[]>('/historico/rota', {
      params: { satelite_id, limit },
    })
    return data
  },

  /**
   * Lista os IDs únicos de satélites com histórico registrado.
   */
  async listarSatelites(): Promise<string[]> {
    const { data } = await api.get<string[]>('/historico/satelites')
    return data
  },
}
