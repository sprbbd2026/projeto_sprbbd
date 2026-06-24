import type { Localizacao, RotaCoordenada } from '../types/localizacao'
import type { SatellitePoint } from '../services/satelliteService'

export const DEMO_DAYS = 60
const TOTAL_MINUTES = DEMO_DAYS * 24 * 60
export const DEMO_POINTS_PER_SAT = 2160
export const DEMO_INTERVAL_MINUTES = TOTAL_MINUTES / Math.max(DEMO_POINTS_PER_SAT - 1, 1)
const ORBITAL_PERIOD_MIN = 96.0

type OrbitParams = {
  inc: number
  raan: number
  latBias: number
  lng0: number
  lngSweep: number
}

const ORBIT_PARAMS: Record<number, OrbitParams> = {
  1: { inc: 14.0, raan: 0.35, latBias: -10.0, lng0: -69.0, lngSweep: 32.0 },
  2: { inc: 20.0, raan: 1.55, latBias: -16.0, lng0: -66.0, lngSweep: 28.0 },
  3: { inc: 17.5, raan: 2.85, latBias: -6.5, lng0: -71.0, lngSweep: 35.0 },
  4: { inc: 23.0, raan: 4.1, latBias: -20.0, lng0: -64.0, lngSweep: 30.0 },
  5: { inc: 12.5, raan: 5.4, latBias: -4.0, lng0: -70.5, lngSweep: 33.0 },
}

function satIndex(sateliteId: string): number {
  const n = Number.parseInt(sateliteId, 10)
  if (Number.isFinite(n) && n > 0) return Math.max(1, Math.min(5, n))
  return (sateliteId.length % 5) + 1
}

function clampBrazil(lat: number, lng: number): [number, number] {
  return [Math.max(-33.5, Math.min(5.5, lat)), Math.max(-74.0, Math.min(-34.0, lng))]
}

function groundTrack(sid: number, params: OrbitParams, elapsedMin: number): [number, number] {
  const elapsedDays = elapsedMin / (24 * 60)
  const tNorm = elapsedDays / DEMO_DAYS
  const theta = (elapsedMin / ORBITAL_PERIOD_MIN) * 2 * Math.PI + params.raan

  let lat = params.latBias + params.inc * Math.sin(theta)
  lat += 2.2 * Math.sin(theta * 2.0 + sid * 0.62)
  lat += 1.1 * Math.cos(theta * 3.0 + params.raan * 1.3)

  let lng = params.lng0 + tNorm * params.lngSweep
  lng += (params.inc / 12.0) * Math.cos(theta * 0.96 + sid * 0.25)
  lng += 3.2 * Math.sin(theta * 1.48 + params.raan * 0.9)
  lng += 1.8 * Math.sin(elapsedDays * 0.55 + sid * 0.4)

  return clampBrazil(lat, lng)
}

function generateOrbitPoints(
  sateliteId: string,
  numPoints = DEMO_POINTS_PER_SAT,
  endMs = Date.now(),
): Array<{ lat: number; lng: number; alt: number; vel: number; t: number }> {
  const sid = satIndex(sateliteId)
  const params = ORBIT_PARAMS[sid] ?? ORBIT_PARAMS[1]
  const startMs = endMs - DEMO_INTERVAL_MINUTES * (numPoints - 1) * 60 * 1000
  const out: Array<{ lat: number; lng: number; alt: number; vel: number; t: number }> = []

  for (let i = 0; i < numPoints; i++) {
    const elapsedMin = i * DEMO_INTERVAL_MINUTES
    const tMs = startMs + elapsedMin * 60 * 1000
    const theta = (elapsedMin / ORBITAL_PERIOD_MIN) * 2 * Math.PI + params.raan
    const [lat, lng] = groundTrack(sid, params, elapsedMin)
    out.push({
      lat,
      lng,
      alt: 510 + sid * 12 + 20 * Math.sin(theta * 1.25),
      vel: 7400 + sid * 70 + 15 * Math.cos(theta * 0.8),
      t: tMs,
    })
  }

  return out
}

export function gerarRotaDemonstracao(sateliteId: string, limit = 2500): Localizacao[] {
  const orbit = generateOrbitPoints(sateliteId, Math.min(limit, DEMO_POINTS_PER_SAT))
  return orbit.map((p, i) => ({
    id: i + 1,
    satelite_id: sateliteId,
    latitude: p.lat,
    longitude: p.lng,
    altitude_km: p.alt,
    velocidade_kmh: p.vel,
    data_hora: new Date(p.t).toISOString(),
  }))
}

export function gerarRotaDemonstracaoRota(sateliteId: string, limit = DEMO_POINTS_PER_SAT): RotaCoordenada[] {
  return gerarRotaDemonstracao(sateliteId, limit).map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    data_hora: p.data_hora,
  }))
}

export const MOCK_SATELLITES: SatellitePoint[] = [
  { sat_id: 1, sat_status: 'operacional', con_nome: 'SPRB', sat_codigo_prn: 1 },
  { sat_id: 2, sat_status: 'operacional', con_nome: 'SPRB', sat_codigo_prn: 2 },
  { sat_id: 3, sat_status: 'operacional', con_nome: 'SPRB', sat_codigo_prn: 3 },
  { sat_id: 4, sat_status: 'operacional', con_nome: 'SPRB', sat_codigo_prn: 4 },
  { sat_id: 5, sat_status: 'operacional', con_nome: 'SPRB', sat_codigo_prn: 5 },
]
