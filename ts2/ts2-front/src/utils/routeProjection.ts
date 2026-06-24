import type { RotaCoordenada } from '../types/localizacao'

export type LatLngTuple = [number, number]

export const TRAIL_POINT_COUNT = 10

export function toLatLngTuples(points: RotaCoordenada[]): LatLngTuple[] {
  return points.map((p) => [p.latitude, p.longitude])
}

/** Últimos N pontos percorridos (inclui posição atual). */
export function trailRoute(points: RotaCoordenada[], currentIndex: number, maxTrail = TRAIL_POINT_COUNT): LatLngTuple[] {
  if (points.length === 0) return []
  const idx = Math.max(0, Math.min(currentIndex, points.length - 1))
  const start = Math.max(0, idx - maxTrail + 1)
  return toLatLngTuples(points.slice(start, idx + 1))
}

/** Pontos restantes da rota real (a partir da posição atual). */
export function remainingRoute(points: RotaCoordenada[], currentIndex: number): LatLngTuple[] {
  if (points.length === 0) return []
  const idx = Math.max(0, Math.min(currentIndex, points.length - 1))
  if (idx >= points.length - 1) return []
  const current: LatLngTuple = [points[idx].latitude, points[idx].longitude]
  const rest = toLatLngTuples(points.slice(idx + 1))
  return [current, ...rest]
}

/** @deprecated use remainingRoute — projeção sintética (não usada na rota). */
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
