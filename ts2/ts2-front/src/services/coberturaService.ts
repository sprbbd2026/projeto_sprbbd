import { ts1Api } from './ts1Api'

export interface Regiao {
  id: string
  nome: string
  lat: number
  lng: number
}

export interface PosicaoSatelite {
  lat: number
  lng: number
  alt_km: number
}

export interface SateliteCobertura {
  sat_id: number
  con_id: number | null
  sat_status: string
  posicao: PosicaoSatelite
}

export interface CoberturaRegiao {
  regiao: Regiao | null
  ponto: { lat: number; lng: number }
  coberta: boolean
  total: number
  satelites: SateliteCobertura[]
}

export type ConsultaCobertura = { regiao: string } | { lat: number; lng: number }

export interface FootprintGeometry {
  type: string
  coordinates: number[][][] | number[][][][]
}

export interface FootprintFeatureCollection {
  type: string
  features: Array<{
    type: string
    properties: Record<string, unknown>
    geometry: FootprintGeometry | null
  }>
}

export async function getRegioes(): Promise<Regiao[]> {
  const { data } = await ts1Api.get<Regiao[]>('/cobertura/regioes')
  return data
}

export async function getCoberturaPorRegiao(
  consulta: ConsultaCobertura,
): Promise<CoberturaRegiao> {
  const params =
    'regiao' in consulta
      ? { regiao: consulta.regiao }
      : { lat: consulta.lat, lng: consulta.lng }
  const { data } = await ts1Api.get<CoberturaRegiao>('/cobertura/regiao', { params })
  return data
}

export async function getCoberturaSatelite(satId: number): Promise<FootprintFeatureCollection> {
  const { data } = await ts1Api.get<FootprintFeatureCollection>(`/cobertura/satelite/${satId}`)
  return data
}
