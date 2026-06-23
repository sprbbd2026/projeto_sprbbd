import type { RotaCoordenada } from '../types/localizacao'
import { aggregateRouteByInterval, MAX_ROUTE_DISPLAY_POINTS } from '../utils/routeSimplify'
import { localizacaoService } from './localizacaoService'

export interface RouteCacheEntry {
  sateliteId: string
  points: RotaCoordenada[]
  isDemo: boolean
  loadedAt: number
}

export interface RouteBundle {
  routes: Record<string, RouteCacheEntry>
  fromCache: boolean
}

const memoryCache = new Map<string, RouteCacheEntry>()

function cacheKey(sateliteId: string, startTime: string, endTime: string): string {
  return `${sateliteId}|${new Date(startTime).toISOString()}|${new Date(endTime).toISOString()}`
}

async function fetchOneRoute(
  sateliteId: string,
  startTime: string,
  endTime: string,
): Promise<RouteCacheEntry> {
  const inicio = new Date(startTime).toISOString()
  const fim = new Date(endTime).toISOString()

  try {
    const response = await localizacaoService.getRota({
      satelite_id: sateliteId,
      data_inicio: inicio,
      data_fim: fim,
      limit: 1000,
    })

    if (response.rota.length === 0) {
      return {
        sateliteId,
        points: [],
        isDemo: false,
        loadedAt: Date.now(),
      }
    }

    const sorted = [...response.rota].sort(
      (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
    )
    const points =
      sorted.length <= MAX_ROUTE_DISPLAY_POINTS
        ? sorted
        : aggregateRouteByInterval(sorted)
    return {
      sateliteId,
      points,
      isDemo: !!response.gerado_automaticamente,
      loadedAt: Date.now(),
    }
  } catch {
    return {
      sateliteId,
      points: [],
      isDemo: false,
      loadedAt: Date.now(),
    }
  }
}

/**
 * Carrega rotas do cache em memória ou da API (uma vez por satélite/período).
 */
export async function loadRouteBundle(
  satelliteIds: string[],
  startTime: string,
  endTime: string,
  options?: { force?: boolean },
): Promise<RouteBundle> {
  const uniqueIds = [...new Set(satelliteIds.filter(Boolean))]
  const routes: Record<string, RouteCacheEntry> = {}
  const missing: string[] = []
  let fromCache = true

  for (const id of uniqueIds) {
    const key = cacheKey(id, startTime, endTime)
    const hit = !options?.force ? memoryCache.get(key) : undefined
    if (hit) {
      routes[id] = hit
    } else {
      missing.push(id)
      fromCache = false
    }
  }

  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map((id) => fetchOneRoute(id, startTime, endTime)),
    )
    for (const entry of fetched) {
      const key = cacheKey(entry.sateliteId, startTime, endTime)
      memoryCache.set(key, entry)
      routes[entry.sateliteId] = entry
    }
  }

  return { routes, fromCache: fromCache && missing.length === 0 }
}

export function clearRouteCache(): void {
  memoryCache.clear()
}

export function exportRouteBundleJson(bundle: RouteBundle): string {
  const payload = Object.fromEntries(
    Object.entries(bundle.routes).map(([id, entry]) => [
      id,
      {
        satelite_id: id,
        is_demo: entry.isDemo,
        loaded_at: entry.loadedAt,
        pontos: entry.points,
      },
    ]),
  )
  return JSON.stringify(payload, null, 2)
}
