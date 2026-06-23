import { api } from './api'

export interface Coordenada {
  lat: number
  lng: number
}

export interface LegInfo {
  distance_km: number
  duration_min: number
}

export interface RotaResponse {
  geometry: [number, number][]
  distance_km: number
  duration_min: number
  legs: LegInfo[]
  error?: string
}

export interface GeocodeResult {
  display_name: string
  lat: number
  lng: number
  type: string
  address: Record<string, string>
}

export interface GeocodeResponse {
  results: GeocodeResult[]
}

export const routingService = {
  async calcularRota(waypoints: Coordenada[], noCache = false): Promise<RotaResponse> {
    const { data } = await api.post<RotaResponse>('/rotas/calcular', {
      waypoints,
      no_cache: noCache,
    })
    return data
  },

  async geocode(query: string, noCache = false): Promise<GeocodeResult[]> {
    const { data } = await api.get<GeocodeResponse>('/rotas/geocode', {
      params: { q: query, no_cache: noCache },
    })
    return data.results
  },
}
