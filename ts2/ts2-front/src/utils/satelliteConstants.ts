import type { SatellitePoint } from '../services/satelliteService'

export const ALL_SATELLITES_VALUE = 'all'
export const ALL_SATELLITES_LABEL = 'Todos os satélites'

export const SATELLITE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#ef4444',
  '#6366f1',
] as const

/** Formato `datetime-local` (horário local do navegador). */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function colorForSatellite(sateliteId: string | number, index = 0): string {
  const n = Number(sateliteId)
  if (Number.isFinite(n) && n > 0) {
    return SATELLITE_COLORS[(n - 1) % SATELLITE_COLORS.length]
  }
  return SATELLITE_COLORS[index % SATELLITE_COLORS.length]
}

export function isAllSatellites(value: string): boolean {
  return value === ALL_SATELLITES_VALUE
}

/** Rota: início do dia corrente (00:00 local). */
export function defaultTodayStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return toDatetimeLocal(d)
}

/** Rota: fim do dia corrente (23:59 local). */
export function defaultTodayEnd(): string {
  const d = new Date()
  d.setHours(23, 59, 0, 0)
  return toDatetimeLocal(d)
}

/** Histórico: 10 dias antes do início de hoje. */
export function defaultHistoricoStart(): string {
  const d = new Date()
  d.setDate(d.getDate() - 10)
  d.setHours(0, 0, 0, 0)
  return toDatetimeLocal(d)
}

/** Histórico: fim de hoje. */
export function defaultHistoricoEnd(): string {
  return defaultTodayEnd()
}

/** @deprecated use defaultHistoricoStart */
export function defaultWeekStart(): string {
  return defaultHistoricoStart()
}

/** @deprecated use defaultHistoricoEnd */
export function defaultWeekEnd(): string {
  return defaultHistoricoEnd()
}

export function dedupeSatellites(list: SatellitePoint[]): SatellitePoint[] {
  const seen = new Set<number>()
  return list.filter((sat) => {
    if (seen.has(sat.sat_id)) return false
    seen.add(sat.sat_id)
    return true
  })
}
