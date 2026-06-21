import { api } from './api'
import type { Localizacao, HistoricoLocalizacaoParams } from '../types/localizacao'

export const localizacaoService = {
  /**
   * Busca o histórico de localização de um satélite (US302).
   */
  async getHistorico(params: HistoricoLocalizacaoParams): Promise<Localizacao[]> {
    const { data } = await api.get<Localizacao[]>('/historico/localizacao', { params })
    return data
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
