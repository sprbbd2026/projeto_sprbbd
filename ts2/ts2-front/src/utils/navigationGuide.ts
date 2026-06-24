import type { Coordenada } from '../services/routingService'

export interface NavigationStep {
  instruction: string
  maneuver_type: string
  maneuver_modifier?: string | null
  distance_m: number
  duration_s: number
  lat: number
  lng: number
  street: string
}

export type ManeuverIcon =
  | 'straight'
  | 'left'
  | 'right'
  | 'slight-left'
  | 'slight-right'
  | 'uturn'
  | 'roundabout'
  | 'arrive'
  | 'merge'
  | 'ramp'

export function maneuverIcon(step: NavigationStep): ManeuverIcon {
  if (step.maneuver_type === 'arrive') return 'arrive'
  if (step.maneuver_type === 'roundabout' || step.maneuver_type === 'rotary') {
    return 'roundabout'
  }
  if (step.maneuver_type in { merge: 1, 'on ramp': 1, 'off ramp': 1 }) return 'ramp'

  const mod = step.maneuver_modifier ?? ''
  if (mod.includes('uturn')) return 'uturn'
  if (mod === 'left' || mod === 'sharp left') return 'left'
  if (mod === 'right' || mod === 'sharp right') return 'right'
  if (mod === 'slight left') return 'slight-left'
  if (mod === 'slight right') return 'slight-right'
  return 'straight'
}

export function haversineMeters(a: Coordenada, b: Coordenada): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6_371_000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function formatDistanceM(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/** Índice do ponto mais próximo na geometria da rota. */
export function nearestGeometryIndex(pos: Coordenada, geometry: [number, number][]): number {
  let best = 0
  let min = Infinity
  for (let i = 0; i < geometry.length; i++) {
    const d = haversineMeters(pos, { lat: geometry[i][0], lng: geometry[i][1] })
    if (d < min) {
      min = d
      best = i
    }
  }
  return best
}

/** Trecho restante da rota a partir da posição atual. */
export function remainingGeometry(
  pos: Coordenada,
  geometry: [number, number][],
): [number, number][] {
  const idx = nearestGeometryIndex(pos, geometry)
  return [[pos.lat, pos.lng], ...geometry.slice(idx + 1)]
}

export interface NavigationProgress {
  stepIndex: number
  distanceToManeuverM: number
  remainingDistanceM: number
  arrived: boolean
}

/**
 * Determina a manobra atual com base na posição GPS e nos passos OSRM.
 */
export function computeNavigationProgress(
  pos: Coordenada,
  geometry: [number, number][],
  steps: NavigationStep[],
): NavigationProgress {
  if (steps.length === 0) {
    return { stepIndex: 0, distanceToManeuverM: 0, remainingDistanceM: 0, arrived: true }
  }

  const progressIdx = nearestGeometryIndex(pos, geometry)
  let stepIndex = 0

  for (let i = 0; i < steps.length; i++) {
    const stepIdx = nearestGeometryIndex(
      { lat: steps[i].lat, lng: steps[i].lng },
      geometry,
    )
    if (stepIdx <= progressIdx + 2) {
      stepIndex = i
    }
  }

  const current = steps[stepIndex]
  const distanceToManeuverM = haversineMeters(pos, {
    lat: current.lat,
    lng: current.lng,
  })

  if (stepIndex < steps.length - 1 && distanceToManeuverM < 35) {
    stepIndex += 1
  }

  const active = steps[stepIndex]
  const distToActive = haversineMeters(pos, { lat: active.lat, lng: active.lng })

  let remainingDistanceM = distToActive
  for (let i = stepIndex + 1; i < steps.length; i++) {
    remainingDistanceM += steps[i].distance_m
  }

  const last = steps[steps.length - 1]
  const distToDest = haversineMeters(pos, { lat: last.lat, lng: last.lng })
  const arrived =
    active.maneuver_type === 'arrive' || (stepIndex === steps.length - 1 && distToDest < 45)

  return {
    stepIndex,
    distanceToManeuverM: distToActive,
    remainingDistanceM,
    arrived,
  }
}

/** Avança posição simulada ao longo da geometria (demo em desktop). */
export function advanceAlongRoute(
  pos: Coordenada,
  geometry: [number, number][],
  meters: number,
): Coordenada {
  const idx = nearestGeometryIndex(pos, geometry)
  let remaining = meters
  let current = { ...pos }

  for (let i = idx; i < geometry.length - 1 && remaining > 0; i++) {
    const next = { lat: geometry[i + 1][0], lng: geometry[i + 1][1] }
    const segLen = haversineMeters(current, next)
    if (segLen <= remaining) {
      remaining -= segLen
      current = next
    } else {
      const t = remaining / segLen
      current = {
        lat: current.lat + (next.lat - current.lat) * t,
        lng: current.lng + (next.lng - current.lng) * t,
      }
      remaining = 0
    }
  }
  return current
}
