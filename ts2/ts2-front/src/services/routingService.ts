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

  async geocode(
    query: string,
    options: { lat?: number; lng?: number; maxDistanceKm?: number; noCache?: boolean } = {}
  ): Promise<GeocodeResult[]> {
    const { lat, lng, maxDistanceKm = 500, noCache = false } = options
    const { data } = await api.get<GeocodeResponse>('/rotas/geocode', {
      params: {
        q: query,
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
        max_distance_km: maxDistanceKm,
        no_cache: noCache,
      },
    })
    return data.results
  },
}
