import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { routingService, type Coordenada, type RotaResponse } from '../services/routingService'
import { useMapStore } from '../store/mapStore'
import { ITA_DCTA_LABEL, ITA_DCTA_ORIGIN } from '../utils/defaultOrigin'
import { requestCurrentPosition } from '../utils/geolocation'
import { GpsNavigation } from '../components/navigation/GpsNavigation'
import 'leaflet/dist/leaflet.css'

type Cenario = 'ifood' | 'waze' | 'mercadolivre' | 'navegacao'

interface WazeAlert {
  lat: number
  lng: number
  type: 'radar' | 'acidente' | 'obra'
}

// ---- Ícones customizados ----
const createIcon = (emoji: string, size = 32) =>
  L.divIcon({
    html: `<span style="font-size:${size}px;line-height:1">${emoji}</span>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })

const icons = {
  motoboy: createIcon('🏍️'),
  restaurante: createIcon('🍕'),
  cliente: createIcon('📍'),
  motorista: createIcon('🚗'),
  destino: createIcon('🏁'),
  cd: createIcon('🏭'),
  caminhao: createIcon('🚚'),
  radar: createIcon('📸', 24),
  acidente: createIcon('⚠️', 24),
  obra: createIcon('🚧', 24),
}

// ---- Componente de clique no mapa ----
function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng)
    },
  })
  return null
}

// ---- Componente que ajusta o zoom pra mostrar a rota toda ----
function FitRouteBounds({ geometry }: { geometry: [number, number][] | null }) {
  const map = useMap()

  useEffect(() => {
    if (!geometry || geometry.length === 0) return

    const bounds = L.latLngBounds(geometry.map(([lat, lng]) => [lat, lng] as [number, number]))
    map.fitBounds(bounds, { padding: [50, 50], animate: true })
  }, [geometry, map])

  return null
}

// ---- Componente de busca com autocomplete ----
function SearchInput({
  placeholder,
  onSelect,
  value,
  onChangeText,
}: {
  placeholder: string
  onSelect: (coord: Coordenada, name: string) => void
  value?: string
  onChangeText: (text: string) => void
}) {
  const [results, setResults] = useState<{ label: string; sublabel?: string; lat: number; lng: number; isMarker: boolean }[]>([])
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearch = (text: string) => {
    onChangeText(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.length < 3) {
      setResults([])
      setShowResults(false)
      return
    }

    // Busca imediata nos marcadores salvos
    const { locations } = useMapStore.getState()
    const q = text.toLowerCase()
    const markerMatches = locations
      .filter((loc) => loc.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((loc) => ({ label: loc.name, sublabel: loc.category, lat: loc.lat, lng: loc.lng, isMarker: true }))

    setResults(markerMatches)
    if (markerMatches.length > 0) setShowResults(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await routingService.geocode(text)
        const geocodeResults = res.slice(0, 5).map((r) => ({
          label: r.display_name.split(',')[0],
          sublabel: r.display_name.split(',').slice(1, 3).join(',').trim(),
          lat: r.lat,
          lng: r.lng,
          isMarker: false,
        }))
        setResults([...markerMatches, ...geocodeResults])
        setShowResults(true)
      } catch {
        setResults(markerMatches)
      }
    }, 400)
  }

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />
      {showResults && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg">
          {results.map((r, i) => (
            <li
              key={i}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
              onMouseDown={() => {
                onSelect({ lat: r.lat, lng: r.lng }, r.label)
                onChangeText(r.label)
                setShowResults(false)
              }}
            >
              {r.isMarker && <span className="text-red-500 text-xs">📍</span>}
              <span className="truncate">{r.label}</span>
              {r.sublabel && <span className="text-xs text-gray-400 truncate ml-auto">{r.sublabel}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Tabs de cenário ----
const cenarios: { id: Cenario; label: string; icon: string }[] = [
  { id: 'ifood', label: 'iFood', icon: '🍕' },
  { id: 'waze', label: 'Waze', icon: '🚗' },
  { id: 'mercadolivre', label: 'Mercado Livre', icon: '📦' },
  { id: 'navegacao', label: 'GPS', icon: '🧭' },
]

// CDs mock para Mercado Livre
const centrosDistribuicao = [
  { label: 'CD São Paulo (Cajamar)', lat: -23.3562, lng: -46.8769 },
  { label: 'CD Rio de Janeiro (Nova Iguaçu)', lat: -22.7556, lng: -43.4603 },
  { label: 'CD Curitiba (São José dos Pinhais)', lat: -25.5469, lng: -49.1748 },
]

export function SimuladorPage() {
  const [cenario, setCenario] = useState<Cenario>('ifood')
  const [userLocation, setUserLocation] = useState<Coordenada | null>(null)
  const [clickMode, setClickMode] = useState<string | null>(null)

  // iFood
  const [ifoodOrigem, setIfoodOrigem] = useState<Coordenada | null>(null)
  const [ifoodOrigemName, setIfoodOrigemName] = useState('')
  const [ifoodRestaurante, setIfoodRestaurante] = useState<Coordenada | null>(null)
  const [ifoodRestauranteName, setIfoodRestauranteName] = useState('')
  const [ifoodCliente, setIfoodCliente] = useState<Coordenada | null>(null)
  const [ifoodClienteName, setIfoodClienteName] = useState('')

  // Waze
  const [wazeOrigem, setWazeOrigem] = useState<Coordenada | null>(null)
  const [wazeOrigemName, setWazeOrigemName] = useState('')
  const [wazeDestino, setWazeDestino] = useState<Coordenada | null>(null)
  const [wazeDestinoName, setWazeDestinoName] = useState('')
  const [wazeAlerts, setWazeAlerts] = useState<WazeAlert[]>([])

  // Mercado Livre
  const [mlCdIndex, setMlCdIndex] = useState(0)
  const [mlDestino, setMlDestino] = useState<Coordenada | null>(null)
  const [mlDestinoName, setMlDestinoName] = useState('')
  const [mlStatus, setMlStatus] = useState<string>('Aguardando cálculo')

  // Rota resultado
  const [rota, setRota] = useState<RotaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Geolocation — padrão ITA (DCTA); GPS só quando disponível
  useEffect(() => {
    void requestCurrentPosition().then((coord) => {
      const origin = coord ?? { lat: ITA_DCTA_ORIGIN.lat, lng: ITA_DCTA_ORIGIN.lng }
      const label = coord ? 'Minha localização' : ITA_DCTA_LABEL
      setUserLocation(origin)
      setIfoodOrigem(origin)
      setIfoodOrigemName(label)
      setWazeOrigem(origin)
      setWazeOrigemName(label)
    })
  }, [])

  // Gera alertas simulados ao longo da rota (Waze)
  const gerarAlertasWaze = (geometry: [number, number][]) => {
    if (geometry.length < 10) return
    const alertTypes: WazeAlert['type'][] = ['radar', 'acidente', 'obra']
    const alerts: WazeAlert[] = []
    const step = Math.floor(geometry.length / 4)
    for (let i = 1; i <= 3; i++) {
      const idx = Math.min(i * step, geometry.length - 1)
      alerts.push({
        lat: geometry[idx][0],
        lng: geometry[idx][1],
        type: alertTypes[i - 1],
      })
    }
    setWazeAlerts(alerts)
  }

  // Calcula rota
  const handleCalcular = useCallback(async () => {
    setLoading(true)
    setError(null)
    setRota(null)
    setWazeAlerts([])

    try {
      let waypoints: Coordenada[] = []

      if (cenario === 'ifood') {
        if (!ifoodOrigem || !ifoodRestaurante || !ifoodCliente) {
          setError('Defina os 3 pontos: motoboy, restaurante e cliente.')
          return
        }
        waypoints = [ifoodOrigem, ifoodRestaurante, ifoodCliente]
      } else if (cenario === 'waze') {
        if (!wazeOrigem || !wazeDestino) {
          setError('Defina origem e destino.')
          return
        }
        waypoints = [wazeOrigem, wazeDestino]
      } else {
        const cd = centrosDistribuicao[mlCdIndex]
        if (!mlDestino) {
          setError('Defina o endereço de entrega.')
          return
        }
        waypoints = [{ lat: cd.lat, lng: cd.lng }, mlDestino]
      }

      const result = await routingService.calcularRota(waypoints)
      setRota(result)

      if (cenario === 'waze' && result.geometry.length > 0) {
        gerarAlertasWaze(result.geometry)
      }

      if (cenario === 'mercadolivre' && !result.error) {
        setMlStatus('Em trânsito — previsão de chegada em breve')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular rota')
    } finally {
      setLoading(false)
    }
  }, [cenario, ifoodOrigem, ifoodRestaurante, ifoodCliente, wazeOrigem, wazeDestino, mlCdIndex, mlDestino])

  // Clique no mapa
  const handleMapClick = (latlng: L.LatLng) => {
    const coord = { lat: latlng.lat, lng: latlng.lng }
    const name = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`

    if (!clickMode) return

    if (cenario === 'ifood') {
      if (clickMode === 'restaurante') {
        setIfoodRestaurante(coord)
        setIfoodRestauranteName(name)
      } else if (clickMode === 'cliente') {
        setIfoodCliente(coord)
        setIfoodClienteName(name)
      } else if (clickMode === 'origem') {
        setIfoodOrigem(coord)
        setIfoodOrigemName(name)
      }
    } else if (cenario === 'waze') {
      if (clickMode === 'destino') {
        setWazeDestino(coord)
        setWazeDestinoName(name)
      } else if (clickMode === 'origem') {
        setWazeOrigem(coord)
        setWazeOrigemName(name)
      }
    } else {
      if (clickMode === 'destino') {
        setMlDestino(coord)
        setMlDestinoName(name)
      }
    }
    setClickMode(null)
  }

  // Cor da polyline por cenário
  const getPolylineSegments = () => {
    if (!rota || !rota.geometry.length) return []

    if (cenario === 'ifood' && rota.legs.length === 2 && ifoodRestaurante) {
      // Encontra o ponto da geometria mais próximo do restaurante para dividir
      let minDist = Infinity
      let midIdx = 0
      for (let i = 0; i < rota.geometry.length; i++) {
        const [lat, lng] = rota.geometry[i]
        const dist = Math.pow(lat - ifoodRestaurante.lat, 2) + Math.pow(lng - ifoodRestaurante.lng, 2)
        if (dist < minDist) {
          minDist = dist
          midIdx = i
        }
      }
      const seg1 = rota.geometry.slice(0, midIdx + 1) as [number, number][]
      const seg2 = rota.geometry.slice(midIdx) as [number, number][]
      return [
        { positions: seg1, color: '#3b82f6' },  // azul: motoboy → restaurante
        { positions: seg2, color: '#22c55e' },  // verde: restaurante → cliente
      ]
    }

    const color = cenario === 'waze' ? '#6366f1' : '#f59e0b'
    return [{ positions: rota.geometry as [number, number][], color }]
  }

  // Marcadores por cenário
  const renderMarkers = () => {
    const markers: ReactNode[] = []

    if (cenario === 'ifood') {
      if (ifoodOrigem) markers.push(<Marker key="ifood-o" position={[ifoodOrigem.lat, ifoodOrigem.lng]} icon={icons.motoboy}><Popup>Motoboy</Popup></Marker>)
      if (ifoodRestaurante) markers.push(<Marker key="ifood-r" position={[ifoodRestaurante.lat, ifoodRestaurante.lng]} icon={icons.restaurante}><Popup>Restaurante</Popup></Marker>)
      if (ifoodCliente) markers.push(<Marker key="ifood-c" position={[ifoodCliente.lat, ifoodCliente.lng]} icon={icons.cliente}><Popup>Cliente</Popup></Marker>)
    } else if (cenario === 'waze') {
      if (wazeOrigem) markers.push(<Marker key="waze-o" position={[wazeOrigem.lat, wazeOrigem.lng]} icon={icons.motorista}><Popup>Motorista</Popup></Marker>)
      if (wazeDestino) markers.push(<Marker key="waze-d" position={[wazeDestino.lat, wazeDestino.lng]} icon={icons.destino}><Popup>Destino</Popup></Marker>)
      wazeAlerts.forEach((a, i) => {
        markers.push(<Marker key={`alert-${i}`} position={[a.lat, a.lng]} icon={icons[a.type]}><Popup>{a.type.toUpperCase()}</Popup></Marker>)
      })
    } else {
      const cd = centrosDistribuicao[mlCdIndex]
      markers.push(<Marker key="ml-cd" position={[cd.lat, cd.lng]} icon={icons.cd}><Popup>{cd.label}</Popup></Marker>)
      if (mlDestino) markers.push(<Marker key="ml-dest" position={[mlDestino.lat, mlDestino.lng]} icon={icons.cliente}><Popup>Entrega</Popup></Marker>)
    }

    return markers
  }

  // Painel lateral por cenário
  const renderControls = () => {
    if (cenario === 'ifood') {
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">🏍️ Motoboy (origem)</label>
            <div className="flex gap-1">
              <div className="flex-1">
                <SearchInput placeholder="Sua localização" value={ifoodOrigemName} onChangeText={setIfoodOrigemName} onSelect={(c, n) => { setIfoodOrigem(c); setIfoodOrigemName(n) }} />
              </div>
              <button onClick={() => setClickMode('origem')} className={`rounded px-2 text-xs ${clickMode === 'origem' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>📌</button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">🍕 Restaurante (coleta)</label>
            <div className="flex gap-1">
              <div className="flex-1">
                <SearchInput placeholder="Buscar restaurante..." value={ifoodRestauranteName} onChangeText={setIfoodRestauranteName} onSelect={(c, n) => { setIfoodRestaurante(c); setIfoodRestauranteName(n) }} />
              </div>
              <button onClick={() => setClickMode('restaurante')} className={`rounded px-2 text-xs ${clickMode === 'restaurante' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>📌</button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">📍 Cliente (entrega)</label>
            <div className="flex gap-1">
              <div className="flex-1">
                <SearchInput placeholder="Buscar endereço do cliente..." value={ifoodClienteName} onChangeText={setIfoodClienteName} onSelect={(c, n) => { setIfoodCliente(c); setIfoodClienteName(n) }} />
              </div>
              <button onClick={() => setClickMode('cliente')} className={`rounded px-2 text-xs ${clickMode === 'cliente' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>📌</button>
            </div>
          </div>
        </div>
      )
    }

    if (cenario === 'waze') {
      return (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">🚗 Motorista (origem)</label>
            <div className="flex gap-1">
              <div className="flex-1">
                <SearchInput placeholder="Sua localização" value={wazeOrigemName} onChangeText={setWazeOrigemName} onSelect={(c, n) => { setWazeOrigem(c); setWazeOrigemName(n) }} />
              </div>
              <button onClick={() => setClickMode('origem')} className={`rounded px-2 text-xs ${clickMode === 'origem' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>📌</button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">🏁 Destino</label>
            <div className="flex gap-1">
              <div className="flex-1">
                <SearchInput placeholder="Buscar destino..." value={wazeDestinoName} onChangeText={setWazeDestinoName} onSelect={(c, n) => { setWazeDestino(c); setWazeDestinoName(n) }} />
              </div>
              <button onClick={() => setClickMode('destino')} className={`rounded px-2 text-xs ${clickMode === 'destino' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>📌</button>
            </div>
          </div>
        </div>
      )
    }

    // Mercado Livre
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">🏭 Centro de Distribuição</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={mlCdIndex}
            onChange={(e) => setMlCdIndex(Number(e.target.value))}
          >
            {centrosDistribuicao.map((cd, i) => (
              <option key={i} value={i}>{cd.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">📍 Endereço de entrega</label>
          <div className="flex gap-1">
            <div className="flex-1">
              <SearchInput placeholder="Buscar endereço..." value={mlDestinoName} onChangeText={setMlDestinoName} onSelect={(c, n) => { setMlDestino(c); setMlDestinoName(n) }} />
            </div>
            <button onClick={() => setClickMode('destino')} className={`rounded px-2 text-xs ${clickMode === 'destino' ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>📌</button>
          </div>
        </div>
        {rota && !rota.error && (
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">📦 Status: {mlStatus}</p>
            <p className="mt-1 text-xs text-amber-700">
              Previsão: Chega hoje até {new Date(Date.now() + (rota.duration_min * 60000)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    )
  }

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : [ITA_DCTA_ORIGIN.lat, ITA_DCTA_ORIGIN.lng] as [number, number]

  if (cenario === 'navegacao') {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex border-b border-gray-200 bg-white">
          {cenarios.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCenario(c.id); setRota(null); setError(null); setWazeAlerts([]) }}
              className={`flex-1 px-2 py-3 text-sm font-medium transition-colors ${cenario === c.id
                ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          <GpsNavigation embedded />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full">
      {/* Painel lateral */}
      <div className="flex w-96 flex-col border-r border-gray-200 bg-white">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {cenarios.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCenario(c.id); setRota(null); setError(null); setWazeAlerts([]) }}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${cenario === c.id
                ? 'border-b-2 border-blue-500 bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Controles do cenário */}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="mb-4 text-lg font-bold text-gray-800">
            {cenarios.find((c) => c.id === cenario)?.icon} Simulador {cenarios.find((c) => c.id === cenario)?.label}
          </h2>

          {renderControls()}

          {clickMode && (
            <p className="mt-2 animate-pulse text-xs text-blue-600">
              🖱️ Clique no mapa para definir: <strong>{clickMode}</strong>
            </p>
          )}

          <button
            onClick={handleCalcular}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳ Calculando...' : '🗺️ Calcular Rota'}
          </button>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Card de resultado */}
          {rota && !rota.error && (
            <div className="mt-4 rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-bold text-gray-700">📊 Resultado</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📏 Distância total: <strong>{rota.distance_km} km</strong></p>
                <p>⏱️ Tempo estimado: <strong>{rota.duration_min} min</strong></p>
                {rota.legs.length > 1 && (
                  <div className="mt-2 border-t pt-2">
                    <p className="text-xs font-medium text-gray-500">Trechos:</p>
                    {rota.legs.map((leg, i) => (
                      <p key={i} className="text-xs">
                        {cenario === 'ifood' ? (i === 0 ? '🔵 Motoboy → Restaurante' : '🟢 Restaurante → Cliente') : `Trecho ${i + 1}`}:
                        {' '}{leg.distance_km} km • {leg.duration_min} min
                      </p>
                    ))}
                  </div>
                )}
              </div>
              {cenario === 'waze' && wazeAlerts.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <p className="text-xs font-medium text-gray-500">⚠️ Alertas no trajeto:</p>
                  {wazeAlerts.map((a, i) => (
                    <p key={i} className="text-xs">
                      {a.type === 'radar' ? '📸' : a.type === 'acidente' ? '⚠️' : '🚧'} {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-3 text-center text-xs text-gray-400">
          Dados: OpenStreetMap • OSRM • Nominatim
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1">
        <MapContainer center={mapCenter} zoom={12} className="h-full w-full" zoomControl={true}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onClick={handleMapClick} />
          <FitRouteBounds geometry={rota?.geometry ?? null} />

          {/* Polylines */}
          {getPolylineSegments().map((seg, i) => (
            <Polyline key={i} positions={seg.positions} pathOptions={{ color: seg.color, weight: 5, opacity: 0.8 }} />
          ))}

          {/* Marcadores */}
          {renderMarkers()}
        </MapContainer>
      </div>
    </div>
  )
}
