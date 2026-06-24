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
  ROUTE_DASH_ARRAY,
} from '../../utils/mapBasemap'
import { useMapPreferencesStore } from '../../store/mapPreferencesStore'

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
  const routeZoom = useMapPreferencesStore((s) => s.routeMapZoom)
  const routeAutoFit = useMapPreferencesStore((s) => s.routeMapAutoFit)

  useEffect(() => {
    const key = boundsKey(positions)
    if (lastFit.current === key) return
    lastFit.current = key

    if (positions.length === 0) {
      map.setView(BRAZIL_CENTER, routeZoom, { animate: false })
      return
    }

    applyRouteMapView(map, positions as L.LatLngTuple[])
  }, [map, positions, routeZoom, routeAutoFit])

  return null
}

function PlaybackRouteLayer({
  points,
  sateliteId,
  pointIndex,
  showCoverage,
  satelliteIndex = 0,
}: {
  points: RotaCoordenada[]
  sateliteId: string
  pointIndex: number
  showCoverage: boolean
  satelliteIndex?: number
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
  const routeTrailWeight = useMapPreferencesStore((s) => s.routeTrailWeight)
  const routeDashWeight = useMapPreferencesStore((s) => s.routeDashWeight)
  const colorPrefsKey = useMapPreferencesStore(
    (s) => `${s.satelliteColorMode}:${s.satelliteCustomColors[sateliteId] ?? ''}`,
  )
  const lineColor = useMemo(
    () => colorForSatellite(sateliteId, satelliteIndex),
    [sateliteId, satelliteIndex, colorPrefsKey],
  )

  /** Footprint geodésico completo na posição atual — sem recorte ao Brasil (TS1 clipava e sumia fora do bbox). */
  const footprint = useMemo(() => {
    if (!showCoverage || !currentPoint) return [] as LatLngTuple[]
    return calcularFootprint(currentPoint.latitude, currentPoint.longitude)
  }, [showCoverage, currentPoint])

  return (
    <>
      {allPositions.length >= 2 && (
        <Polyline
          positions={allPositions}
          pathOptions={{
            color: lineColor,
            weight: 1,
            opacity: 0.28,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {futurePositions.length >= 2 && (
        <Polyline
          positions={futurePositions}
          pathOptions={{
            weight: routeDashWeight,
            opacity: 0.92,
            dashArray: ROUTE_DASH_ARRAY,
            lineCap: 'round',
            lineJoin: 'round',
            color: lineColor,
          }}
        />
      )}

      {trailPositions.length >= 2 && (
        <Polyline
          positions={trailPositions}
          pathOptions={{
            color: lineColor,
            weight: routeTrailWeight,
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
          pathOptions={{ color: '#fff', fillColor: lineColor, fillOpacity: 1, weight: 2 }}
        />
      )}

      {showCoverage && footprint.length > 0 && current && (
        <Polygon
          positions={footprint}
          pathOptions={{
            color: lineColor,
            weight: 2,
            opacity: 0.9,
            fillColor: lineColor,
            fillOpacity: 0.2,
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
            pointIndex={safeIndex}
            showCoverage={showCoverage}
            satelliteIndex={idx}
          />
        )
      })}
    </>
  )
}
