import { useEffect, useMemo, useRef } from 'react'
import { CircleMarker, Marker, Polygon, Polyline, Popup, useMap } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import L from 'leaflet'
import { renderToString } from 'react-dom/server'
import { Satellite } from 'lucide-react'
import type { RotaCoordenada } from '../../types/localizacao'
import { remainingRoute, toLatLngTuples, trailRoute, TRAIL_POINT_COUNT } from '../../utils/routeProjection'
import { calcularFootprint } from '../../utils/satelliteFootprint'
import { colorForSatellite } from '../../utils/satelliteConstants'
import {
  applyRouteMapView,
  BRAZIL_CENTER,
  ROUTE_MAP_ZOOM,
  ROUTE_DASH_ARRAY,
  ROUTE_DASH_WEIGHT,
  ROUTE_TRAIL_WEIGHT,
} from '../../utils/mapBasemap'

const DASH_FUTURE = {
  weight: ROUTE_DASH_WEIGHT,
  opacity: 0.92,
  dashArray: ROUTE_DASH_ARRAY,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
}

const satelliteIcon = L.divIcon({
  html: renderToString(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #38bdf8 100%)',
        border: '2px solid white',
        boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Satellite size={16} color="#fff" />
    </div>,
  ),
  className: 'route-satellite-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function boundsKey(positions: LatLngTuple[]): string {
  if (positions.length === 0) return 'empty'
  const a = positions[0]
  const z = positions[positions.length - 1]
  return `${positions.length}:${a[0].toFixed(2)},${a[1].toFixed(2)}:${z[0].toFixed(2)},${z[1].toFixed(2)}`
}

function FitRouteView({ positions }: { positions: LatLngTuple[] }) {
  const map = useMap()
  const lastFit = useRef<string | null>(null)

  useEffect(() => {
    const key = boundsKey(positions)
    if (lastFit.current === key) return
    lastFit.current = key

    if (positions.length === 0) {
      map.setView(BRAZIL_CENTER, ROUTE_MAP_ZOOM, { animate: false })
      return
    }

    applyRouteMapView(map, positions as L.LatLngTuple[])
  }, [map, positions])

  return null
}

function PlaybackRouteLayer({
  points,
  sateliteId,
  color,
  pointIndex,
  showCoverage,
}: {
  points: RotaCoordenada[]
  sateliteId: string
  color: string
  pointIndex: number
  showCoverage: boolean
}) {
  const allPositions = useMemo(() => toLatLngTuples(points), [points])
  const safeIndex = Math.max(0, Math.min(pointIndex, points.length - 1))
  const trailPositions = useMemo(
    () => trailRoute(points, safeIndex, TRAIL_POINT_COUNT),
    [points, safeIndex],
  )
  const futurePositions = useMemo(
    () => remainingRoute(points, safeIndex),
    [points, safeIndex],
  )
  const current = allPositions[safeIndex]
  const currentPoint = points[safeIndex]

  const footprint = useMemo(() => {
    if (!showCoverage || !currentPoint) return []
    return calcularFootprint(currentPoint.latitude, currentPoint.longitude)
  }, [showCoverage, currentPoint])

  return (
    <>
      {futurePositions.length >= 2 && (
        <Polyline
          positions={futurePositions}
          pathOptions={{
            ...DASH_FUTURE,
            color,
          }}
        />
      )}

      {trailPositions.length >= 2 && (
        <Polyline
          positions={trailPositions}
          pathOptions={{
            color,
            weight: ROUTE_TRAIL_WEIGHT,
            opacity: 0.92,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {trailPositions.length === 1 && (
        <CircleMarker
          center={trailPositions[0]}
          radius={5}
          pathOptions={{ color: '#fff', fillColor: color, fillOpacity: 1, weight: 2 }}
        />
      )}

      {showCoverage && footprint.length > 0 && (
        <Polygon
          positions={footprint}
          pathOptions={{
            color: '#38bdf8',
            weight: 2,
            opacity: 0.85,
            fillColor: '#0ea5e9',
            fillOpacity: 0.18,
          }}
        />
      )}

      {current && (
        <Marker position={current} icon={satelliteIcon} zIndexOffset={1000}>
          <Popup>
            <strong>Satélite {sateliteId}</strong>
            <br />
            {new Date(currentPoint.data_hora).toLocaleString('pt-BR')}
          </Popup>
        </Marker>
      )}
    </>
  )
}

interface RouteMapLayersProps {
  mode: 'single' | 'multi'
  routes: Record<string, RotaCoordenada[]>
  satelliteIds: string[]
  activeSatelliteId?: string
  pointIndex?: number
  showCoverage?: boolean
}

export function RouteMapLayers({
  mode,
  routes,
  satelliteIds,
  activeSatelliteId,
  pointIndex = 0,
  showCoverage = true,
}: RouteMapLayersProps) {
  const allPositions = useMemo(
    () =>
      satelliteIds.flatMap((id) => {
        const pts = routes[id]
        return pts ? toLatLngTuples(pts) : []
      }),
    [routes, satelliteIds],
  )

  if (mode === 'single' && activeSatelliteId) {
    const points = routes[activeSatelliteId]
    if (!points?.length) return null
    return (
      <>
        <FitRouteView positions={allPositions} />
        <PlaybackRouteLayer
          points={points}
          sateliteId={activeSatelliteId}
          color={colorForSatellite(activeSatelliteId)}
          pointIndex={pointIndex}
          showCoverage={showCoverage}
        />
      </>
    )
  }

  return (
    <>
      <FitRouteView positions={allPositions} />
      {satelliteIds.map((id, idx) => {
        const points = routes[id]
        if (!points?.length) return null
        const safeIndex = Math.max(0, Math.min(pointIndex, points.length - 1))
        return (
          <PlaybackRouteLayer
            key={id}
            points={points}
            sateliteId={id}
            color={colorForSatellite(id, idx)}
            pointIndex={safeIndex}
            showCoverage={showCoverage}
          />
        )
      })}
    </>
  )
}
