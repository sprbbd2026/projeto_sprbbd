import type { RotaCoordenada } from '../types/localizacao'

export type LatLngTuple = [number, number]

/** Projeção simples da órbita a partir dos últimos pontos (demonstração). */
export function projectFutureRoute(
  points: RotaCoordenada[],
  futureSteps = 14,
): LatLngTuple[] {
  if (points.length < 2) return []

  const n = points.length
  const p0 = points[n - 3] ?? points[n - 2]
  const p1 = points[n - 2]
  const p2 = points[n - 1]

  const vLat = p2.latitude - p1.latitude
  const vLng = p2.longitude - p1.longitude
  const aLat = p2.latitude - 2 * p1.latitude + p0.latitude
  const aLng = p2.longitude - 2 * p1.longitude + p0.longitude

  const future: LatLngTuple[] = []
  for (let i = 1; i <= futureSteps; i++) {
    const lat = p2.latitude + vLat * i + 0.5 * aLat * i * i
    const lng = p2.longitude + vLng * i + 0.5 * aLng * i * i
    future.push([lat, lng])
  }

  return future
}

export function toLatLngTuples(points: RotaCoordenada[]): LatLngTuple[] {
  return points.map((p) => [p.latitude, p.longitude])
}
