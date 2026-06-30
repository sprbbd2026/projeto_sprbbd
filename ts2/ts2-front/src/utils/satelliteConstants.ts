import type { SatellitePoint } from '../services/satelliteService'
import { useMapPreferencesStore } from '../store/mapPreferencesStore'

export const ALL_SATELLITES_VALUE = 'all'
export const ALL_SATELLITES_LABEL = 'Todos os satélites'

export const SATELLITE_COLORS = [
  '#1e3a8a', // navy
  '#9f1239', // vinho
  '#ca8a04', // amarelo-ouro escuro
  '#0f766e', // teal escuro
  '#6b21a8', // roxo
  '#b45309', // âmbar
  '#7c2d12', // terracota
  '#312e81', // índigo
] as const

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Formato `YYYY-MM-DD`. */
export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toDateTimeInput(d: Date): string {
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Converte data (YYYY-MM-DD) → início do dia para API (datetime-local). */
export function dateToDayStart(dateStr: string): string {
  return `${dateStr}T00:00`
}

/** Converte data (YYYY-MM-DD) → fim do dia para API (datetime-local). */
export function dateToDayEnd(dateStr: string): string {
  return `${dateStr}T23:59`
}

export function colorForSatellite(sateliteId: string | number, index = 0): string {
  const { satelliteColorMode, satelliteCustomColors } = useMapPreferencesStore.getState()
  const key = String(sateliteId)

  if (satelliteColorMode === 'custom' && satelliteCustomColors[key]) {
    return satelliteCustomColors[key]
  }

  const n = Number(sateliteId)
  if (Number.isFinite(n) && n > 0) {
    return SATELLITE_COLORS[(n - 1) % SATELLITE_COLORS.length]
  }
  return SATELLITE_COLORS[index % SATELLITE_COLORS.length]
}

export function isAllSatellites(value: string): boolean {
  return value === ALL_SATELLITES_VALUE
}

/** Rota: dia corrente (YYYY-MM-DD). */
export function defaultTodayDate(): string {
  return toDateInput(new Date())
}

/** Histórico: início (10 dias atrás, incluindo hoje). */
export function defaultHistoricoStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 9)
  return toDateInput(d)
}

/** Histórico: fim (hoje). */
export function defaultHistoricoEndDate(): string {
  return toDateInput(new Date())
}

export function defaultHistoricoStartDateTime(): string {
  return dateToDayStart(defaultHistoricoStartDate())
}

export function defaultHistoricoEndDateTime(): string {
  return dateToDayEnd(defaultHistoricoEndDate())
}

/** @deprecated use defaultTodayDate + dateToDayStart/End */
export function defaultTodayStart(): string {
  return dateToDayStart(defaultTodayDate())
}

/** @deprecated use defaultTodayDate + dateToDayStart/End */
export function defaultTodayEnd(): string {
  return dateToDayEnd(defaultTodayDate())
}

/** @deprecated use defaultHistoricoStartDate */
export function defaultHistoricoStart(): string {
  return dateToDayStart(defaultHistoricoStartDate())
}

/** @deprecated use defaultHistoricoEndDate */
export function defaultHistoricoEnd(): string {
  return dateToDayEnd(defaultHistoricoEndDate())
}

export function dedupeSatellites(list: SatellitePoint[]): SatellitePoint[] {
  const seen = new Set<number>()
  return list.filter((sat) => {
    if (seen.has(sat.sat_id)) return false
    seen.add(sat.sat_id)
    return true
  })
}
