import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  GitMerge,
  LocateFixed,
  Maximize2,
  Minimize2,
  Navigation,
  RotateCcw,
  CircleDot,
  Square,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { routingService, type Coordenada, type RotaResponse } from '../../services/routingService'
import { ITA_DCTA_LABEL, ITA_DCTA_ORIGIN, MAP_DEFAULT_CENTER } from '../../utils/defaultOrigin'
import { getRequestErrorMessage } from '../../utils/error'
import { requestCurrentPosition } from '../../utils/geolocation'
import {
  advanceAlongRoute,
  computeNavigationProgress,
  formatDistanceM,
  maneuverIcon,
  remainingGeometry,
  type ManeuverIcon,
  type NavigationStep,
} from '../../utils/navigationGuide'
import styles from './gpsNavigation.module.css'

type NavMode = 'gps' | 'simulate'

function ManeuverGlyph({ kind }: { kind: ManeuverIcon }) {
  const size = 28
  switch (kind) {
    case 'left':
    case 'slight-left':
      return <CornerUpLeft size={size} />
    case 'right':
    case 'slight-right':
      return <CornerUpRight size={size} />
    case 'uturn':
      return <RotateCcw size={size} />
    case 'roundabout':
      return <CircleDot size={size} />
    case 'arrive':
      return <Square size={size} />
    case 'merge':
    case 'ramp':
      return <GitMerge size={size} />
    default:
      return <ArrowUp size={size} />
  }
}

function MapFollower({
  position,
  navigating,
}: {
  position: Coordenada | null
  navigating: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (!position || !navigating) return
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 16), {
      animate: true,
    })
  }, [map, position, navigating])
  return null
}

function FitRouteBounds({
  geometry,
  fitKey,
  enabled,
}: {
  geometry: [number, number][] | null
  fitKey: number
  enabled: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (!enabled || !geometry || geometry.length === 0 || fitKey === 0) return

    const bounds = L.latLngBounds(
      geometry.map(([lat, lng]) => [lat, lng] as [number, number]),
    )
    map.fitBounds(bounds, { padding: [56, 56], animate: true })
  }, [enabled, fitKey, geometry, map])

  return null
}

function AddressField({
  label,
  value,
  onChange,
  onPick,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onPick: (coord: Coordenada, name: string) => void
}) {
  const [suggestions, setSuggestions] = useState<
    { label: string; lat: number; lng: number }[]
  >([])
  const [focused, setFocused] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const open = focused && suggestions.length > 0

  const handleChange = (text: string) => {
    onChange(text)
    if (debounce.current) clearTimeout(debounce.current)
    if (text.length < 3) {
      setSuggestions([])
      return
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await routingService.geocode(text, {
          lat: ITA_DCTA_ORIGIN.lat,
          lng: ITA_DCTA_ORIGIN.lng,
        })
        setSuggestions(
          res.slice(0, 5).map((r) => ({
            label: r.display_name.split(',')[0],
            lat: r.lat,
            lng: r.lng,
          })),
        )
      } catch {
        setSuggestions([])
      }
    }, 350)
  }

  return (
    <div
      className={`${styles.addressField} ${open ? styles.addressFieldOpen : ''}`}
    >
      <label className={styles.addressLabel}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setFocused(false), 150)
        }}
        className={styles.addressInput}
        autoComplete="off"
      />
      {open && (
        <ul className={styles.suggestionsList} role="listbox">
          {suggestions.map((s) => (
            <li key={`${s.lat}-${s.lng}`} role="option">
              <button
                type="button"
                className={styles.suggestionItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick({ lat: s.lat, lng: s.lng }, s.label)
                  onChange(s.label)
                  setSuggestions([])
                  setFocused(false)
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export interface GpsNavigationProps {
  embedded?: boolean
}

export function GpsNavigation({ embedded: _embedded = false }: GpsNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const watchIdRef = useRef<number | null>(null)
  const simulateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [origin, setOrigin] = useState<Coordenada>({
    lat: ITA_DCTA_ORIGIN.lat,
    lng: ITA_DCTA_ORIGIN.lng,
  })
  const [originLabel, setOriginLabel] = useState(ITA_DCTA_LABEL)
  const [destLabel, setDestLabel] = useState('')
  const [destination, setDestination] = useState<Coordenada | null>(null)
  const [route, setRoute] = useState<RotaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [navigating, setNavigating] = useState(false)
  const [navMode, setNavMode] = useState<NavMode>('gps')
  const [position, setPosition] = useState<Coordenada | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [useLiveGpsOrigin, setUseLiveGpsOrigin] = useState(false)
  const [routeFitKey, setRouteFitKey] = useState(0)
  const [routeSnapshot, setRouteSnapshot] = useState<{
    origin: Coordenada
    destination: Coordenada
  } | null>(null)

  const routeMatchesInputs =
    routeSnapshot !== null &&
    destination !== null &&
    Math.abs(routeSnapshot.origin.lat - origin.lat) < 1e-5 &&
    Math.abs(routeSnapshot.origin.lng - origin.lng) < 1e-5 &&
    Math.abs(routeSnapshot.destination.lat - destination.lat) < 1e-5 &&
    Math.abs(routeSnapshot.destination.lng - destination.lng) < 1e-5

  const hasValidRoute = Boolean(route && !route.error && routeMatchesInputs)

  const steps = useMemo(() => route?.steps ?? [], [route?.steps])
  const progress = useMemo(() => {
    if (!position || !route?.geometry.length || !navigating || !hasValidRoute) return null
    return computeNavigationProgress(position, route.geometry, steps)
  }, [position, route?.geometry, steps, navigating, hasValidRoute])

  const activeStep: NavigationStep | null =
    progress && steps.length > 0 ? steps[progress.stepIndex] : null

  const stopNavigation = useCallback(() => {
    setNavigating(false)
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (simulateTimerRef.current) {
      clearInterval(simulateTimerRef.current)
      simulateTimerRef.current = null
    }
  }, [])

  useEffect(() => () => stopNavigation(), [stopNavigation])

  useEffect(() => {
    void requestCurrentPosition().then((coord) => {
      if (coord) {
        setOrigin(coord)
        setOriginLabel('Minha localização')
        setPosition(coord)
        setUseLiveGpsOrigin(true)
      } else {
        setPosition({ lat: ITA_DCTA_ORIGIN.lat, lng: ITA_DCTA_ORIGIN.lng })
        setUseLiveGpsOrigin(false)
      }
    })
  }, [])

  const handleUseGpsOrigin = async () => {
    const coord = await requestCurrentPosition()
    stopNavigation()
    if (coord) {
      setOrigin(coord)
      setOriginLabel('Minha localização')
      setPosition(coord)
      setUseLiveGpsOrigin(true)
      setError(null)
    } else {
      setError('GPS indisponível. Usando o ITA como origem.')
      setOrigin({ lat: ITA_DCTA_ORIGIN.lat, lng: ITA_DCTA_ORIGIN.lng })
      setOriginLabel(ITA_DCTA_LABEL)
      setUseLiveGpsOrigin(false)
    }
  }

  const handleOriginPick = (c: Coordenada, n: string) => {
    stopNavigation()
    setOrigin(c)
    setOriginLabel(n)
    setUseLiveGpsOrigin(n === 'Minha localização')
    setPosition(c)
  }

  const handleDestPick = (c: Coordenada, n: string) => {
    stopNavigation()
    setDestination(c)
    setDestLabel(n)
  }

  const handleOriginLabelChange = (text: string) => {
    if (text !== originLabel) {
      stopNavigation()
      setUseLiveGpsOrigin(false)
    }
    setOriginLabel(text)
  }

  const handleDestLabelChange = (text: string) => {
    if (text !== destLabel) {
      stopNavigation()
    }
    setDestLabel(text)
    if (!text.trim()) setDestination(null)
  }

  const handleCalculate = async () => {
    if (!destination) {
      setError('Informe o destino (selecione uma opção da lista).')
      return
    }
    setLoading(true)
    setError(null)
    stopNavigation()
    try {
      const result = await routingService.calcularRota([origin, destination], {
        includeSteps: true,
        noCache: true,
      })
      if (result.error || result.geometry.length === 0) {
        setError(result.error ?? 'Não foi possível calcular a rota.')
        return
      }
      setRoute(result)
      setRouteSnapshot({ origin: { ...origin }, destination: { ...destination } })
      setPosition({ ...origin })
      setRouteFitKey((key) => key + 1)
    } catch (err: unknown) {
      setError(getRequestErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const startNavigation = useCallback(() => {
    if (!hasValidRoute || !route?.geometry.length) {
      setError('Calcule a rota novamente antes de iniciar.')
      return
    }

    setNavigating(true)
    setError(null)

    if (navMode === 'simulate') {
      const start = { lat: origin.lat, lng: origin.lng }
      setPosition(start)
      simulateTimerRef.current = setInterval(() => {
        setPosition((prev) => {
          if (!prev || !route.geometry.length) return prev
          return advanceAlongRoute(prev, route.geometry, 35)
        })
      }, 1000)
      return
    }

    // GPS real: só faz sentido com origem = localização atual do dispositivo
    if (!useLiveGpsOrigin) {
      setError(
        'Origem manual: use o modo Simular ou clique no ícone GPS para usar sua localização.',
      )
      setNavigating(false)
      return
    }

    if (!navigator.geolocation) {
      setError('GPS não suportado neste navegador. Use o modo Simular.')
      setNavigating(false)
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        setError('Perda do sinal GPS. Tentando reconectar…')
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    )
  }, [hasValidRoute, route, origin, navMode, useLiveGpsOrigin])

  useEffect(() => {
    if (progress?.arrived && navigating) {
      stopNavigation()
    }
  }, [progress?.arrived, navigating, stopNavigation])

  const toggleFullscreen = async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const remainingLine = useMemo(() => {
    if (!route?.geometry.length) return []
    if (!navigating || !position || !hasValidRoute) {
      return route.geometry
    }
    return remainingGeometry(position, route.geometry)
  }, [route?.geometry, position, navigating, hasValidRoute])

  const mapCenter: [number, number] = position
    ? [position.lat, position.lng]
    : MAP_DEFAULT_CENTER

  const layoutClass = [styles.root, fullscreen ? styles.rootFullscreen : ''].filter(Boolean).join(' ')

  const thirdButtonLabel = navigating
    ? 'Encerrar'
    : hasValidRoute
      ? 'Iniciar'
      : route && !routeMatchesInputs
        ? 'Recalcular'
        : loading
          ? '…'
          : 'Calcular'

  const handleThirdButton = () => {
    if (navigating) {
      stopNavigation()
      return
    }
    if (hasValidRoute) {
      startNavigation()
      return
    }
    void handleCalculate()
  }

  return (
    <div ref={containerRef} className={layoutClass}>
      {!navigating && (
        <header className={styles.toolbar}>
          <div className={styles.toolbarHeader}>
            <div>
              <p className={styles.toolbarTitle}>Navegação GPS</p>
              <p className={styles.toolbarSubtitle}>
                Origem, destino e modo — depois inicie a navegação
              </p>
            </div>
          </div>

          <div className={styles.fieldsRow}>
            <div className={styles.originWrap}>
              <div className={styles.originField}>
                <AddressField
                  label="Origem"
                  value={originLabel}
                  onChange={handleOriginLabelChange}
                  onPick={handleOriginPick}
                />
              </div>
              <button
                type="button"
                onClick={() => void handleUseGpsOrigin()}
                className={styles.locateBtn}
                title="Usar minha localização"
              >
                <LocateFixed size={16} />
              </button>
            </div>

            <AddressField
              label="Destino"
              value={destLabel}
              onChange={handleDestLabelChange}
              onPick={handleDestPick}
            />
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={() => setNavMode('gps')}
              className={`${styles.actionBtn} ${
                navMode === 'gps' ? styles.actionBtnModeActiveGps : styles.actionBtnMode
              }`}
            >
              GPS real
            </button>
            <button
              type="button"
              onClick={() => setNavMode('simulate')}
              className={`${styles.actionBtn} ${
                navMode === 'simulate' ? styles.actionBtnModeActiveSim : styles.actionBtnMode
              }`}
            >
              Simular
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleThirdButton}
              className={`${styles.actionBtn} ${
                navigating
                  ? styles.actionBtnDanger
                  : hasValidRoute
                    ? styles.actionBtnPrimary
                    : styles.actionBtnCalculate
              }`}
            >
              {thirdButtonLabel}
            </button>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {route && !route.error && !routeMatchesInputs && (
            <div className={styles.staleBanner}>
              Origem ou destino alterados — clique em <strong>Recalcular</strong> para atualizar a rota.
            </div>
          )}

          {hasValidRoute && route && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryDest} title={destLabel || 'Destino'}>
                → {destLabel || 'Destino'}
              </span>
              <span>
                <strong>{route.distance_km} km</strong> · ~{Math.round(route.duration_min)} min
              </span>
            </div>
          )}
        </header>
      )}

      <div className={styles.mapArea}>
        <MapContainer center={mapCenter} zoom={14} className="h-full w-full" zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <MapFollower position={position} navigating={navigating} />
          <FitRouteBounds
            geometry={route?.geometry ?? null}
            fitKey={routeFitKey}
            enabled={!navigating}
          />

          {route && !route.error && (
            <Polyline
              positions={remainingLine}
              pathOptions={{
                color: hasValidRoute ? '#2563eb' : '#94a3b8',
                weight: hasValidRoute ? 7 : 5,
                opacity: hasValidRoute ? (navigating ? 0.9 : 0.65) : 0.3,
                dashArray: hasValidRoute ? undefined : '10 10',
              }}
            />
          )}

          {destination && (
            <Marker
              position={[destination.lat, destination.lng]}
              icon={L.divIcon({
                className: '',
                html: '<div style="font-size:24px">🏁</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 24],
              })}
            />
          )}

          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={8}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: '#059669',
              fillOpacity: 1,
            }}
          />

          {position &&
            (navigating ||
              Math.abs(position.lat - origin.lat) > 1e-5 ||
              Math.abs(position.lng - origin.lng) > 1e-5) && (
            <CircleMarker
              center={[position.lat, position.lng]}
              radius={navigating ? 10 : 8}
              pathOptions={{
                color: '#fff',
                weight: 3,
                fillColor: '#2563eb',
                fillOpacity: 1,
              }}
            />
          )}
        </MapContainer>

        <div className={styles.floatingTools}>
          {navigating && (
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.stopBtn}`}
              onClick={stopNavigation}
              title="Encerrar navegação"
            >
              Encerrar
            </button>
          )}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => void toggleFullscreen()}
            title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {navigating && activeStep && progress && (
          <>
            <div className={styles.hud}>
              <div className={styles.hudInner}>
                <div className={styles.maneuverIcon}>
                  <ManeuverGlyph kind={maneuverIcon(activeStep)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold leading-tight">{activeStep.instruction}</p>
                  {activeStep.street && (
                    <p className="mt-0.5 truncate text-sm text-blue-100">{activeStep.street}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-300">
                    em {formatDistanceM(progress.distanceToManeuverM)}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.bottomBar}>
              <div className={styles.bottomInner}>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Navigation size={18} className="text-blue-600" />
                  <span>
                    Restam <strong>{formatDistanceM(progress.remainingDistanceM)}</strong>
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {navMode === 'gps' ? 'GPS ativo' : 'Simulação'}
                </span>
              </div>
            </div>
          </>
        )}

        {progress?.arrived && !navigating && (
          <div className={styles.hud}>
            <div className={styles.hudInner}>
              <div className={styles.maneuverIcon}>
                <ManeuverGlyph kind="arrive" />
              </div>
              <p className="text-lg font-semibold">Você chegou ao destino</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function GpsNavigationEmbedded(): ReactNode {
  return <GpsNavigation embedded />
}
