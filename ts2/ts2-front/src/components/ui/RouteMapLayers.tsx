import { useEffect, useMemo, useRef } from 'react'
import { CircleMarker, Marker, Polygon, Polyline, Popup, useMap } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import L from 'leaflet'
import { renderToString } from 'react-dom/server'
import { Satellite } from 'lucide-react'
import type { RotaCoordenada } from '../../types/localizacao'
import { projectFutureRoute, toLatLngTuples } from '../../utils/routeProjection'
import { calcularFootprint } from '../../utils/satelliteFootprint'
import { colorForSatellite } from '../../utils/satelliteConstants'

const BRAZIL_CENTER: LatLngTuple = [-14.2, -51.9]
const BRAZIL_ZOOM = 5
const FUTURE_STEPS = 8

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

function FitRouteView({
  pastPositions,
  futurePositions,
}: {
  pastPositions: LatLngTuple[]
  futurePositions: LatLngTuple[]
}) {
  const map = useMap()
  const lastFit = useRef<string | null>(null)

  useEffect(() => {
    const key = boundsKey([...pastPositions, ...futurePositions])
    if (lastFit.current === key) return
    lastFit.current = key

    const all = [...pastPositions, ...futurePositions]
    if (all.length === 0) {
      map.setView(BRAZIL_CENTER, BRAZIL_ZOOM)
      return
    }

    const bounds = L.latLngBounds(all).pad(0.15)
    map.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: 12,
      animate: false,
    })
  }, [map, pastPositions, futurePositions])

  return null
}

function PlaybackRouteLayer({
  points,
  sateliteId,
  color,
  pointIndex,
  showCoverage,
  compact = false,
}: {
  points: RotaCoordenada[]
  sateliteId: string
  color: string
  pointIndex: number
  showCoverage: boolean
  compact?: boolean
}) {
  const pastPositions = useMemo(() => toLatLngTuples(points), [points])
  const futurePositions = useMemo(
    () => (compact ? [] : projectFutureRoute(points, FUTURE_STEPS)),
    [points, compact],
  )
  const safeIndex = Math.max(0, Math.min(pointIndex, points.length - 1))
  const trailPositions = useMemo(
    () => pastPositions.slice(0, safeIndex + 1),
    [pastPositions, safeIndex],
  )
  const current = pastPositions[safeIndex]
  const currentPoint = points[safeIndex]
  const start = pastPositions[0]
  const end = pastPositions[pastPositions.length - 1]

  const footprint = useMemo(() => {
    if (!showCoverage || !currentPoint) return []
    return calcularFootprint(currentPoint.latitude, currentPoint.longitude)
  }, [showCoverage, currentPoint])

  return (
    <>
      {!compact && (
        <FitRouteView pastPositions={pastPositions} futurePositions={futurePositions} />
      )}

      {!compact && futurePositions.length > 0 && (
        <Polyline
          positions={futurePositions}
          pathOptions={{
            color: '#f59e0b',
            weight: 2,
            opacity: 0.65,
            dashArray: '6 8',
            lineCap: 'round',
          }}
        />
      )}

      <Polyline
        positions={pastPositions}
        pathOptions={{
          color: compact ? color : '#94a3b8',
          weight: compact ? 2 : 1.5,
          opacity: compact ? 0.35 : 0.25,
          dashArray: compact ? '4 6' : '4 8',
        }}
      />

      {trailPositions.length >= 2 && (
        <Polyline
          positions={trailPositions}
          pathOptions={{ color, weight: compact ? 4 : 5, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }}
        />
      )}

      {trailPositions.length === 1 && (
        <CircleMarker
          center={trailPositions[0]}
          radius={compact ? 4 : 5}
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
            fillOpacity: compact ? 0.14 : 0.22,
          }}
        />
      )}

      {!compact && start && safeIndex > 0 && (
        <CircleMarker
          center={start}
          radius={5}
          pathOptions={{ color: '#fff', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }}
        />
      )}

      {!compact && end && end !== start && safeIndex === pastPositions.length - 1 && (
        <CircleMarker
          center={end}
          radius={4}
          pathOptions={{ color: '#fff', fillColor: '#ef4444', fillOpacity: 0.9, weight: 2 }}
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
  const allPast = useMemo(
    () =>
      satelliteIds.flatMap((id) => {
        const pts = routes[id]
        return pts ? toLatLngTuples(pts) : []
      }),
    [routes, satelliteIds],
  )
  const allFuture = useMemo(
    () =>
      satelliteIds.flatMap((id) => {
        const pts = routes[id]
        return pts ? projectFutureRoute(pts, FUTURE_STEPS) : []
      }),
    [routes, satelliteIds],
  )

  if (mode === 'single' && activeSatelliteId) {
    const points = routes[activeSatelliteId]
    if (!points?.length) return null
    return (
      <PlaybackRouteLayer
        points={points}
        sateliteId={activeSatelliteId}
        color={colorForSatellite(activeSatelliteId)}
        pointIndex={pointIndex}
        showCoverage={showCoverage}
      />
    )
  }

  return (
    <>
      <FitRouteView pastPositions={allPast} futurePositions={allFuture} />
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
            compact
          />
        )
      })}
    </>
  )
}
