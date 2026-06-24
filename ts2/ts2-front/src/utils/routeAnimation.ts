import { useEffect, useRef, useState } from 'react'
import type { LatLngTuple } from './routeProjection'

const LOOP_MS = 14_000
const PAUSE_MS = 1_800

export interface RouteAnimationState {
  current: LatLngTuple | null
  trail: LatLngTuple[]
  progress: number
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function interpolateAlongRoute(
  positions: LatLngTuple[],
  progress: number,
): RouteAnimationState {
  if (positions.length === 0) {
    return { current: null, trail: [], progress: 0 }
  }
  if (positions.length === 1) {
    return { current: positions[0], trail: [positions[0]], progress: 1 }
  }

  const clamped = Math.min(1, Math.max(0, progress))
  const segments = positions.length - 1
  const exact = clamped * segments
  const idx = Math.min(Math.floor(exact), segments - 1)
  const t = exact - idx
  const a = positions[idx]
  const b = positions[idx + 1]
  const current: LatLngTuple = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
  const trail = [...positions.slice(0, idx + 1), current]

  return { current, trail, progress: clamped }
}

/** Animação contínua (só avança); ao terminar, pausa e reinicia do início. */
export function useSmoothRouteAnimation(
  positions: LatLngTuple[],
  enabled: boolean,
): RouteAnimationState {
  const [progress, setProgress] = useState(0)
  const positionsRef = useRef(positions)
  positionsRef.current = positions

  useEffect(() => {
    if (!enabled || positions.length < 2) {
      setProgress(1)
      return
    }

    setProgress(0)
    let raf = 0
    let cycleStart: number | null = null

    const tick = (ts: number) => {
      if (cycleStart === null) cycleStart = ts
      const elapsed = ts - cycleStart

      if (elapsed >= LOOP_MS + PAUSE_MS) {
        cycleStart = ts
        setProgress(0)
      } else if (elapsed <= LOOP_MS) {
        setProgress(elapsed / LOOP_MS)
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [positions, enabled])

  return interpolateAlongRoute(positions, enabled ? progress : 1)
}
