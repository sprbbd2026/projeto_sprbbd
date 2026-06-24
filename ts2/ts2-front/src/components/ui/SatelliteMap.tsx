/* ================================================================
  SatelliteMap — componente de mapa Leaflet para US303
  Exibe posição histórica, footprint de cobertura e marcador de satélite
  ================================================================ */

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { renderToString } from 'react-dom/server'
import { Satellite } from 'lucide-react'
import type { Localizacao } from '../../types/localizacao'
import type { LatLngTuple } from '../../utils/routeProjection'
import { calcularFootprint } from '../../utils/satelliteFootprint'
import { drawCoverageMask } from '../../utils/coverageCanvas'
import { colorForSatellite } from '../../utils/satelliteConstants'
import {
  applyHistoricoMapView,
  BRAZIL_CENTER,
  getHistoricoMapZoom,
  HISTORICO_LINE_WEIGHT_MULTI,
  HISTORICO_LINE_WEIGHT_SINGLE,
  MAP_ATTRIBUTION,
} from '../../utils/mapBasemap'
import { attachSprbGeoBasemap, applyOceanBackground, updateLandGeoJsonStyle } from '../../utils/sprbGeoBasemap'
import { useMapPreferencesStore } from '../../store/mapPreferencesStore'
import styles from './SatelliteMap.module.css'
import './mapBasemap.module.css'

// Corrige o ícone padrão do Leaflet com Vite/Webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})


const satelliteIcon = L.divIcon({
  html: renderToString(
    <div style={{
      width: 28,
      height: 28,
      borderRadius: 999,
      background: 'linear-gradient(135deg, #0f172a, #3b82f6)',
      border: '2px solid white',
      boxShadow: '0 8px 18px rgba(15, 23, 42, 0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Satellite size={15} color="#fff" />
    </div>
  ),
  className: 'satellite-marker-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

/** Footprints geodésicos completos em cada ponto do histórico (sem recorte ao Brasil da API TS1). */
function collectLocalFootprints(pontos: Localizacao[]): LatLngTuple[][] {
  return pontos.map((p) => calcularFootprint(p.latitude, p.longitude, p.altitude_km))
}

interface SatelliteMapProps {
  pontos: Localizacao[]
  sateliteId: string
  visualizationMode: 'fixed' | 'coverage'
  onToggleVisualization: () => void
  defaultCenter?: [number, number]
  defaultZoom?: number
}

function groupBySatellite(pontos: Localizacao[]): Map<string, Localizacao[]> {
  const groups = new Map<string, Localizacao[]>()
  for (const p of pontos) {
    const key = p.satelite_id
    const list = groups.get(key) ?? []
    list.push(p)
    groups.set(key, list)
  }
  for (const [key, list] of groups) {
    groups.set(
      key,
      [...list].sort((a, b) => a.data_hora.localeCompare(b.data_hora)),
    )
  }
  return groups
}

// Ícone personalizado para o ponto inicial (verde)
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Ícone personalizado para o ponto final (vermelho)
const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function addRoutePolylines(
  group: L.LayerGroup,
  groups: Map<string, Localizacao[]>,
  multi: boolean,
): void {
  let idx = 0
  for (const [satId, satPontos] of groups) {
    const color = colorForSatellite(satId, idx)
    idx += 1
    const latlngs = satPontos.map((p) => [p.latitude, p.longitude] as L.LatLngTuple)

    L.polyline(latlngs, {
      color,
      weight: multi ? HISTORICO_LINE_WEIGHT_MULTI : HISTORICO_LINE_WEIGHT_SINGLE,
      opacity: 0.9,
    }).addTo(group)
  }
}

function addFixedModeMarkers(group: L.LayerGroup, groups: Map<string, Localizacao[]>, multi: boolean): void {
  let idx = 0
  for (const [satId, satPontos] of groups) {
    const color = colorForSatellite(satId, idx)
    idx += 1

    if (!multi) {
      satPontos.forEach((p, i) => {
        const isFirst = i === 0
        const isLast = i === satPontos.length - 1
        const marker = L.marker([p.latitude, p.longitude], {
          icon: isFirst ? startIcon : isLast ? endIcon : L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [15, 24],
            iconAnchor: [7, 24],
            popupAnchor: [1, -20],
            shadowSize: [24, 24],
          }),
        })
        const dataHora = new Date(p.data_hora).toLocaleString('pt-BR')
        marker.bindPopup(
          `<strong>Satélite ${satId}</strong><br/>Lat: ${p.latitude.toFixed(5)}, Lon: ${p.longitude.toFixed(5)}<br/><em>${dataHora}</em>`,
        )
        marker.addTo(group)
      })
    } else if (satPontos.length > 0) {
      const last = satPontos[satPontos.length - 1]
      L.circleMarker([last.latitude, last.longitude], {
        radius: 6,
        color: '#fff',
        fillColor: color,
        fillOpacity: 1,
        weight: 2,
      })
        .bindPopup(`<strong>SAT-${satId}</strong> · posição mais recente`)
        .addTo(group)
    }
  }
}

function addCoverageModeMarkers(group: L.LayerGroup, groups: Map<string, Localizacao[]>): void {
  for (const [satId, satPontos] of groups) {
    const ultimo = satPontos[satPontos.length - 1]
    if (!ultimo) continue

    const marker = L.marker([ultimo.latitude, ultimo.longitude], {
      icon: satelliteIcon,
    })
    const dataHora = new Date(ultimo.data_hora).toLocaleString('pt-BR')
    marker.bindPopup(
      `<strong>Satélite ${satId}</strong><br/>
       Lat: ${ultimo.latitude.toFixed(5)}, Lon: ${ultimo.longitude.toFixed(5)}<br/>
       <em>${dataHora}</em>`,
    )
    marker.addTo(group)
  }
}

export default function SatelliteMap({
  pontos,
  sateliteId,
  visualizationMode,
  onToggleVisualization,
  defaultCenter = BRAZIL_CENTER,
  defaultZoom = getHistoricoMapZoom(),
}: SatelliteMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const landLayerRef = useRef<L.GeoJSON | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const coverageCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const footprintsRef = useRef<LatLngTuple[][]>([])
  const redrawCoverageRef = useRef<(() => void) | null>(null)
  const oceanColor = useMapPreferencesStore((s) => s.oceanColor)
  const landColor = useMapPreferencesStore((s) => s.landColor)
  const landBorderColor = useMapPreferencesStore((s) => s.landBorderColor)
  const historicoZoom = useMapPreferencesStore((s) => s.historicoMapZoom)
  const historicoAutoFit = useMapPreferencesStore((s) => s.historicoMapAutoFit)
  const colorPrefsKey = useMapPreferencesStore((s) =>
    JSON.stringify({ mode: s.satelliteColorMode, colors: s.satelliteCustomColors }),
  )

  // Inicializa o mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      attributionControl: false,
    })

    L.control.attribution({ prefix: false }).addAttribution(MAP_ATTRIBUTION).addTo(map)

    void attachSprbGeoBasemap(map)
      .then((layer) => {
        landLayerRef.current = layer
      })
      .catch((error: unknown) => {
        console.error('Erro ao carregar basemap GeoJSON:', error)
      })

    map.createPane('coveragePane')
    const coveragePane = map.getPane('coveragePane')
    if (coveragePane) {
      coveragePane.style.zIndex = '350'
      coveragePane.style.pointerEvents = 'none'
    }

    const coverageCanvas = L.DomUtil.create('canvas', 'leaflet-coverage-canvas') as HTMLCanvasElement
    coverageCanvas.style.pointerEvents = 'none'
    map.getPane('coveragePane')?.appendChild(coverageCanvas)
    coverageCanvasRef.current = coverageCanvas

    const redrawCoverage = () => {
      const currentMap = mapRef.current
      const canvas = coverageCanvasRef.current
      if (!currentMap || !canvas) return
      drawCoverageMask(currentMap, canvas, footprintsRef.current)
    }
    redrawCoverageRef.current = redrawCoverage

    layerGroupRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    map.on('moveend zoomend zoom resize viewreset', redrawCoverage)

    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.off('moveend zoomend zoom resize viewreset', redrawCoverage)
      map.remove()
      mapRef.current = null
      coverageCanvasRef.current = null
      redrawCoverageRef.current = null
    }
  }, [defaultCenter, defaultZoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    applyOceanBackground(map)
    if (landLayerRef.current) updateLandGeoJsonStyle(landLayerRef.current)
  }, [oceanColor, landColor, landBorderColor])

  // Atualiza camada visual conforme o modo selecionado
  useEffect(() => {
    const map = mapRef.current
    const group = layerGroupRef.current
    if (!map || !group) return

    requestAnimationFrame(() => map.invalidateSize())

    group.clearLayers()

    if (pontos.length === 0) {
      footprintsRef.current = []
      redrawCoverageRef.current?.()
      map.setView(defaultCenter, defaultZoom)
      return
    }

    const groups = groupBySatellite(pontos)
    const multi = groups.size > 1
    const allLatLngs: L.LatLngTuple[] = pontos.map((p) => [p.latitude, p.longitude])

    addRoutePolylines(group, groups, multi)

    if (visualizationMode === 'fixed') {
      footprintsRef.current = []
      redrawCoverageRef.current?.()
      addFixedModeMarkers(group, groups, multi)
    } else {
      footprintsRef.current = collectLocalFootprints(pontos)
      addCoverageModeMarkers(group, groups)
      redrawCoverageRef.current?.()
    }

    applyHistoricoMapView(map, allLatLngs as L.LatLngTuple[], multi)
  }, [pontos, sateliteId, visualizationMode, defaultCenter, defaultZoom, historicoZoom, historicoAutoFit, colorPrefsKey])

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onToggleVisualization}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1000,
          border: 'none',
          borderRadius: 999,
          padding: '0.6rem 0.9rem',
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 700,
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.25)',
          cursor: 'pointer',
        }}
      >
        {visualizationMode === 'fixed' ? 'Ver cobertura' : 'Ver pontos fixos'}
      </button>
      <div
        ref={containerRef}
        className={`${styles.mapContainer} sprbDarkMap`}
        style={
          {
            '--map-ocean-color': oceanColor,
            '--map-land-color': landColor,
            '--map-land-border-color': landBorderColor,
          } as React.CSSProperties
        }
      />
    </div>
  )
}
