export type LatLngTuple = [number, number]

const ANGULO_ELEVACAO_MIN = (5 * Math.PI) / 180
const R_EARTH_KM = 6371
const DEFAULT_ALT_KM = 512

/** Área de cobertura no solo (elevação mínima 5°). */
export function calcularFootprint(
  lat: number,
  lng: number,
  altKm = DEFAULT_ALT_KM,
): LatLngTuple[] {
  const rho = Math.acos(R_EARTH_KM / (R_EARTH_KM + altKm)) - ANGULO_ELEVACAO_MIN
  const pontos: LatLngTuple[] = []

  for (let k = 0; k <= 48; k++) {
    const az = (k * 2 * Math.PI) / 48
    const latR = (lat * Math.PI) / 180
    const lngR = (lng * Math.PI) / 180

    const latP = Math.asin(
      Math.sin(latR) * Math.cos(rho) + Math.cos(latR) * Math.sin(rho) * Math.cos(az),
    )

    const lngP =
      lngR +
      Math.atan2(
        Math.sin(az) * Math.sin(rho) * Math.cos(latR),
        Math.cos(rho) - Math.sin(latR) * Math.sin(latP),
      )

    pontos.push([(latP * 180) / Math.PI, (lngP * 180) / Math.PI])
  }

  return pontos
}
