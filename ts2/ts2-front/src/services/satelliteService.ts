import { ts1Api } from './ts1Api'

export interface SatellitePoint {
  sat_id: number
  con_id?: number | null
  con_nome?: string | null
  sat_relogio_offset?: number | null
  sat_codigo_prn?: number | null
  sat_numero_svn?: number | null
  sat_status: string
}

export async function fetchSatelites(): Promise<SatellitePoint[]> {
  try {
    const { data } = await ts1Api.get<SatellitePoint[]>('/satellites/')
    return data
  } catch (error) {
    console.error('Erro ao buscar satélites do ts1-back:', error)
    return []
  }
}

