import { api } from './api'
import { ts1Api } from './ts1Api'
import type { Localizacao, HistoricoLocalizacaoParams, RotaResponse } from '../types/localizacao'

interface Ts1LocationRow {
  tlm_id: number
  sat_id: number
  timestamp: string
  position: {
    lat: number
    lng: number
    alt_km: number
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
      limit: params.limit ?? 200,
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
        data_hora: item.timestamp,
      }))
  },

  /**
   * Busca a rota de um satélite no período informado (US300).
   */
  async getRota(params: HistoricoLocalizacaoParams): Promise<RotaResponse> {
    const { data } = await api.get<RotaResponse>('/historico/rota', { params })
    return data
  },

  async getRotaComoHistorico(
    params: HistoricoLocalizacaoParams,
  ): Promise<{ pontos: Localizacao[]; geradoAutomaticamente: boolean }> {
    const response = await this.getRota(params)
    const pontos = response.rota.map((p, i) => ({
      id: i + 1,
      satelite_id: response.satelite_id,
      latitude: p.latitude,
      longitude: p.longitude,
      data_hora: p.data_hora,
    }))
    return { pontos, geradoAutomaticamente: !!response.gerado_automaticamente }
  },

  /**
   * Lista os IDs únicos de satélites com histórico registrado.
   */
  async listarSatelites(): Promise<string[]> {
    const { data } = await api.get<string[]>('/historico/satelites')
    return data
  },
}
