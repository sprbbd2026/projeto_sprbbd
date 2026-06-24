import axios from 'axios'

import { api } from './api'
import { localizacaoService } from './localizacaoService'
import { MOCK_SATELLITES } from '../mocks/demoData'
import { dedupeSatellites } from '../utils/satelliteConstants'

export interface SatellitePoint {
  sat_id: number
  con_id?: number | null
  con_nome?: string | null
  sat_relogio_offset?: number | null
  sat_codigo_prn?: number | null
  sat_numero_svn?: number | null
  sat_status: string
}

export class SatelliteFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SatelliteFetchError'
  }
}

export async function fetchSatelites(): Promise<SatellitePoint[]> {
  try {
    const { data } = await api.get<SatellitePoint[]>('/integracao/satelites')
    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new SatelliteFetchError(
          'Backend TS2 desatualizado (rota /integracao/satelites ausente). Execute stop-sprb.bat e depois start-sprb.bat.',
        )
      }
      if (error.response?.status === 503) {
        throw new SatelliteFetchError(
          'Não foi possível ler satélites do TS1. Verifique se o PostgreSQL do TS1 está na porta 5432.',
        )
      }
    }
    console.error('Erro ao buscar satélites:', error)
    return []
  }
}

export async function loadSatelliteCatalog(): Promise<SatellitePoint[]> {
  let list: SatellitePoint[] = []

  try {
    list = await fetchSatelites()
  } catch (error) {
    if (error instanceof SatelliteFetchError) {
      console.warn(error.message)
    }
  }

  if (list.length === 0) {
    try {
      const ids = await localizacaoService.listarSatelites()
      list = ids.map((id) => ({
        sat_id: Number.parseInt(id, 10) || 0,
        sat_status: 'com histórico',
      }))
    } catch {
      /* ignora */
    }
  }

  const merged = dedupeSatellites(list.length > 0 ? list : MOCK_SATELLITES)
  return merged.sort((a, b) => a.sat_id - b.sat_id)
}
