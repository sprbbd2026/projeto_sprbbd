import type { RotaCoordenada } from '../types/localizacao'

/** Máximo de pontos exibidos na animação da rota. */
export const MAX_ROUTE_DISPLAY_POINTS = 1000

/** Intervalo de 1 hora (dados no banco). */
export const ROUTE_INTERVAL_MS = 60 * 60 * 1000

/**
 * Resume a rota com um ponto por janela de tempo (último ponto de cada bucket).
 */
export function aggregateRouteByInterval(
  points: RotaCoordenada[],
  intervalMs = ROUTE_INTERVAL_MS,
): RotaCoordenada[] {
  if (points.length <= 2) return points

  const sorted = [...points].sort(
    (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
  )

  const buckets = new Map<number, RotaCoordenada[]>()

  for (const point of sorted) {
    const t = new Date(point.data_hora).getTime()
    const bucket = Math.floor(t / intervalMs) * intervalMs
    const list = buckets.get(bucket) ?? []
    list.push(point)
    buckets.set(bucket, list)
  }

  const aggregated = Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([, pts]) => pts[pts.length - 1])
    .filter((point, idx, arr) => {
      if (idx === 0) return true
      const prev = arr[idx - 1]
      return (
        point.latitude !== prev.latitude ||
        point.longitude !== prev.longitude ||
        point.data_hora !== prev.data_hora
      )
    })

  return subsampleRouteEvenly(aggregated, MAX_ROUTE_DISPLAY_POINTS)
}

/** Amostragem uniforme preservando início e fim. */
export function subsampleRouteEvenly(
  points: RotaCoordenada[],
  maxPoints = MAX_ROUTE_DISPLAY_POINTS,
): RotaCoordenada[] {
  if (points.length <= maxPoints) return points
  if (maxPoints <= 1) return [points[0]]

  const step = (points.length - 1) / (maxPoints - 1)
  return Array.from({ length: maxPoints }, (_, i) => points[Math.round(i * step)])
}

/** @deprecated use aggregateRouteByInterval */
export function simplifyRoutePoints(
  points: RotaCoordenada[],
  _startTime?: string,
  _endTime?: string,
): RotaCoordenada[] {
  return aggregateRouteByInterval(points)
}
