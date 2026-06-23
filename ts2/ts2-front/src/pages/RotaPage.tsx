import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Globe2, RefreshCw, Route } from 'lucide-react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { DashboardLayout } from '../components/layout/DashboardLayout'
import { RouteMapLegend } from '../components/ui/RouteMapLegend'
import { RouteMapLayers } from '../components/ui/RouteMapLayers'
import { RoutePlaybackBar } from '../components/ui/RoutePlaybackBar'
import { SatelliteSearchSelect } from '../components/ui/SatelliteSearchSelect'
import { useRoutePlayback } from '../hooks/useRoutePlayback'
import { loadRouteBundle, clearRouteCache } from '../services/rotaRouteLoader'
import { loadSatelliteCatalog, type SatellitePoint } from '../services/satelliteService'
import type { RotaCoordenada } from '../types/localizacao'
import type { RouteLegendSatellite, RouteStatus } from '../types/route'
import { projectFutureRoute } from '../utils/routeProjection'
import {
  ALL_SATELLITES_VALUE,
  colorForSatellite,
  defaultTodayEnd,
  defaultTodayStart,
  isAllSatellites,
} from '../utils/satelliteConstants'
import styles from './RotaPage.module.css'

const BRAZIL_CENTER: [number, number] = [-14.2, -51.9]
const FUTURE_STEPS = 8

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function MapResize() {
  const map = useMap()
  useEffect(() => {
    const run = () => map.invalidateSize()
    run()
    const t1 = window.setTimeout(run, 200)
    const t2 = window.setTimeout(run, 600)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [map])
  return null
}

function labelSatelite(sat: SatellitePoint): string {
  const prn = sat.sat_codigo_prn != null ? `PRN ${sat.sat_codigo_prn}` : `SAT-${sat.sat_id}`
  const constelacao = sat.con_nome ? ` · ${sat.con_nome}` : ''
  const status = sat.sat_status ? ` · ${sat.sat_status}` : ''
  return `${prn}${constelacao}${status}`
}

function buildLegend(
  routes: Record<string, RotaCoordenada[]>,
  satelliteIds: string[],
  isDemo: boolean,
): { pointCount: number; futureCount: number; isDemo: boolean; satellites: RouteLegendSatellite[] } {
  let pointCount = 0
  let futureCount = 0
  const satellites: RouteLegendSatellite[] = []

  satelliteIds.forEach((id, idx) => {
    const pts = routes[id]
    if (!pts?.length) return
    pointCount += pts.length
    futureCount += projectFutureRoute(pts, FUTURE_STEPS).length
    satellites.push({
      id,
      label: `SAT-${id}`,
      color: colorForSatellite(id, idx),
      pointCount: pts.length,
    })
  })

  return { pointCount, futureCount, isDemo, satellites }
}

export default function RotaPage() {
  const [satelites, setSatelites] = useState<SatellitePoint[]>([])
  const [loadingSatelites, setLoadingSatelites] = useState(true)
  const [sateliteId, setSateliteId] = useState('1')
  const [dataInicio, setDataInicio] = useState(defaultTodayStart)
  const [dataFim, setDataFim] = useState(defaultTodayEnd)
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [routePoints, setRoutePoints] = useState<Record<string, RotaCoordenada[]>>({})
  const [legendInfo, setLegendInfo] = useState({
    pointCount: 0,
    futureCount: 0,
    isDemo: false,
    satellites: [] as RouteLegendSatellite[],
  })

  const lastQueryRef = useRef<string>('')
  const initialLoadDone = useRef(false)
  const [routeLoadId, setRouteLoadId] = useState(0)

  const satelliteIds = useMemo(
    () =>
      isAllSatellites(sateliteId)
        ? satelites.map((s) => String(s.sat_id))
        : sateliteId.trim()
          ? [sateliteId.trim()]
          : [],
    [sateliteId, satelites],
  )

  const loadRoutes = useCallback(
    async (force = false, idsOverride?: string[]) => {
      const ids = idsOverride ?? satelliteIds
      if (!ids.length) return
      if (new Date(dataInicio) >= new Date(dataFim)) {
        setRouteStatus('error')
        setStatusMessage('O início deve ser anterior ao fim.')
        return
      }

      const querySignature = `${ids.join(',')}|${dataInicio}|${dataFim}`
      if (!force && !idsOverride && querySignature === lastQueryRef.current) {
        return
      }

      setRouteStatus('loading')
      setStatusMessage('Carregando rotas…')

      if (force) {
        clearRouteCache()
      }

      try {
        const bundle = await loadRouteBundle(ids, dataInicio, dataFim, { force })

        let anyDemo = false
        const merged: Record<string, RotaCoordenada[]> = {}
        for (const id of ids) {
          const entry = bundle.routes[id]
          if (entry) {
            merged[id] = entry.points
            if (entry.isDemo) anyDemo = true
          }
        }

        const displayId = idsOverride
          ? ids.length > 1
            ? ALL_SATELLITES_VALUE
            : ids[0]
          : sateliteId
        const cacheHint = bundle.fromCache ? ' · cache' : ''
        const intervalHint = ' · até 1000 pts'

        setRoutePoints((prev) => {
          const next = { ...prev, ...merged }
          const legend = buildLegend(next, ids, anyDemo)
          setLegendInfo(legend)
          setRouteStatus('success')
          setStatusMessage(
            `${legend.pointCount} pontos${intervalHint}${cacheHint}${
              isAllSatellites(displayId)
                ? ` · ${ids.length} satélites`
                : ` · SAT-${displayId}`
            }`,
          )
          return next
        })

        if (!idsOverride) {
          lastQueryRef.current = querySignature
        }
        setRouteLoadId((n) => n + 1)
      } catch {
        setRouteStatus('error')
        setStatusMessage('Não foi possível carregar as rotas.')
      }
    },
    [satelliteIds, dataInicio, dataFim, sateliteId],
  )

  function handleSateliteChange(id: string) {
    setSateliteId(id)
    const ids = isAllSatellites(id) ? satelites.map((s) => String(s.sat_id)) : [id]
    const hasAll = ids.every((sid) => (routePoints[sid]?.length ?? 0) > 0)

    if (!hasAll) {
      void loadRoutes(false, ids)
      return
    }

    const legend = buildLegend(routePoints, ids, legendInfo.isDemo)
    setLegendInfo(legend)
    setRouteStatus('success')
    setStatusMessage(
      `${legend.pointCount} pontos · até 1000 pts · ${
        isAllSatellites(id) ? `${ids.length} satélites` : `SAT-${id}`
      } (memória)`,
    )
  }

  useEffect(() => {
    setDataInicio(defaultTodayStart())
    setDataFim(defaultTodayEnd())
  }, [])

  useEffect(() => {
    void (async () => {
      setLoadingSatelites(true)
      const lista = await loadSatelliteCatalog()
      setSatelites(lista)
      setLoadingSatelites(false)
    })()
  }, [])

  useEffect(() => {
    if (loadingSatelites || !satelites.length || initialLoadDone.current) return
    initialLoadDone.current = true
    void loadRoutes(false)
  }, [loadingSatelites, satelites, loadRoutes])

  const sateliteAtual = satelites.find((s) => String(s.sat_id) === sateliteId)
  const sateliteLabel = isAllSatellites(sateliteId)
    ? 'Todos os satélites'
    : sateliteAtual
      ? labelSatelite(sateliteAtual)
      : `SAT-${sateliteId}`
  const isLoading = routeStatus === 'loading'
  const showLegend = routeStatus === 'success' && legendInfo.pointCount > 0
  const hasRoutes = Object.keys(routePoints).length > 0
  const playbackPointCount = useMemo(() => {
    if (!hasRoutes) return 0
    const lengths = satelliteIds.map((id) => routePoints[id]?.length ?? 0)
    return Math.max(...lengths, 0)
  }, [hasRoutes, satelliteIds, routePoints])
  const playbackKey = `${satelliteIds.join(',')}|${dataInicio}|${dataFim}|${routeLoadId}`
  const playback = useRoutePlayback(playbackPointCount, playbackKey, true)
  const referenceId = isAllSatellites(sateliteId) ? satelliteIds[0] : sateliteId
  const referencePoints = referenceId ? routePoints[referenceId] ?? [] : []
  const currentTimeLabel =
    referencePoints[playback.pointIndex]?.data_hora != null
      ? new Date(referencePoints[playback.pointIndex].data_hora).toLocaleString('pt-BR')
      : ''

  function handleConsultar() {
    if (!sateliteId.trim()) {
      setRouteStatus('error')
      setStatusMessage('Selecione um satélite.')
      return
    }
    void loadRoutes(true)
  }

  return (
    <DashboardLayout>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <div>
              <p className={styles.kicker}>
                <Globe2 size={14} />
                Visão orbital · IGSO regional · figura-8 · dia corrente · 30 min
              </p>
              <h1 className={styles.title}>
                <Route size={26} strokeWidth={1.8} />
                Rota do satélite
              </h1>
              <p className={styles.subtitle}>
                Todos os satélites carregam ao abrir; play percorre a rota em loop com cobertura
                ativa.
              </p>
            </div>
          </header>

          <div className={styles.toolbar} aria-label="Filtros">
            <div className={`${styles.field} ${styles.fieldSatelite}`}>
              <label htmlFor="satelite-rota">Satélite</label>
              <SatelliteSearchSelect
                options={satelites}
                value={sateliteId}
                onChange={handleSateliteChange}
                labelFor={labelSatelite}
                placeholder={loadingSatelites ? 'Carregando satélites…' : 'Pesquisar satélite…'}
                disabled={loadingSatelites}
                showAllOption
              />
              {!loadingSatelites && (
                <span className={styles.satCount}>{satelites.length} satélite(s) disponível(is)</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="rota-inicio">Início</label>
              <input
                id="rota-inicio"
                type="datetime-local"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="rota-fim">Fim</label>
              <input
                id="rota-fim"
                type="datetime-local"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={styles.searchBtn}
              onClick={handleConsultar}
              disabled={isLoading || loadingSatelites || !sateliteId.trim()}
            >
              <RefreshCw size={15} className={isLoading ? styles.spinner : ''} />
              Consultar
            </button>
          </div>

          <section className={styles.mapSection} aria-label="Mapa da rota">
            <div className={styles.mapFrame}>
              <MapContainer
                center={BRAZIL_CENTER}
                zoom={5}
                minZoom={2}
                maxZoom={18}
                worldCopyJump
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
                className={styles.leafletMap}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a> · OSM'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapResize />
                {hasRoutes && (
                  <RouteMapLayers
                    mode={isAllSatellites(sateliteId) ? 'multi' : 'single'}
                    routes={routePoints}
                    satelliteIds={satelliteIds}
                    activeSatelliteId={isAllSatellites(sateliteId) ? undefined : sateliteId}
                    pointIndex={playback.pointIndex}
                    showCoverage
                  />
                )}
              </MapContainer>
            </div>

            {hasRoutes && (
              <RoutePlaybackBar
                pointIndex={playback.pointIndex}
                pointCount={playbackPointCount}
                playing={playback.playing}
                currentTimeLabel={currentTimeLabel}
                onTogglePlay={playback.togglePlay}
                onScrub={playback.scrub}
              />
            )}

            {showLegend && (
              <RouteMapLegend
                pointCount={legendInfo.pointCount}
                futureCount={legendInfo.futureCount}
                isDemo={legendInfo.isDemo}
                sateliteLabel={sateliteLabel}
                satellites={legendInfo.satellites}
              />
            )}

            <div
              className={`${styles.mapOverlay} ${styles[`overlay${routeStatus.charAt(0).toUpperCase()}${routeStatus.slice(1)}`]}`}
              role="status"
              aria-live="polite"
            >
              {routeStatus === 'loading' && 'Carregando rotas (1 requisição por satélite)…'}
              {routeStatus === 'idle' && 'Selecione o satélite e clique em Consultar.'}
              {(routeStatus === 'success' ||
                routeStatus === 'empty' ||
                routeStatus === 'error') &&
                statusMessage}
            </div>
          </section>
        </div>
      </main>
    </DashboardLayout>
  )
}
