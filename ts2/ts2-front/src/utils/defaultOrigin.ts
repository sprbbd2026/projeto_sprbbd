/** Origem padrão do mapa e do cálculo de rotas — campus do ITA no DCTA (SJC). */
export const ITA_DCTA_ORIGIN = {
  lat: -23.2081,
  lng: -45.8828,
} as const

export const ITA_DCTA_LABEL = 'ITA — São José dos Campos (DCTA)'

export const MAP_DEFAULT_CENTER: [number, number] = [
  ITA_DCTA_ORIGIN.lat,
  ITA_DCTA_ORIGIN.lng,
]

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 60_000,
}
