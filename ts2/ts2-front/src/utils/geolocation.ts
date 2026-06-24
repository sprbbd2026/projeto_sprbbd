import { GEOLOCATION_OPTIONS } from './defaultOrigin'

export interface Coordenada {
  lat: number
  lng: number
}

/** Tenta obter a posição atual; retorna `null` se indisponível ou negada. */
export function requestCurrentPosition(): Promise<Coordenada | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      GEOLOCATION_OPTIONS,
    )
  })
}
