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
import { calcularFootprint } from '../../utils/satelliteFootprint'
import { colorForSatellite } from '../../utils/satelliteConstants'
import styles from './SatelliteMap.module.css'

// Corrige o ícone padrão do Leaflet com Vite/Webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COVERAGE_FILL = '#60a5fa'
const COVERAGE_MAX_FOOTPRINTS = 90

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

function subsamplePontos(pontos: Localizacao[], max: number): Localizacao[] {
  if (pontos.length <= max) return pontos
  const step = (pontos.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => pontos[Math.round(i * step)])
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

export default function SatelliteMap({
  pontos,
  sateliteId,
  visualizationMode,
  onToggleVisualization,
  defaultCenter = [-15.78, -47.93],
  defaultZoom = 5,
}: SatelliteMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const coverageGroupRef = useRef<L.LayerGroup | null>(null)

  // Inicializa o mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    map.createPane('coveragePane')
    const coveragePane = map.getPane('coveragePane')
    if (coveragePane) {
      coveragePane.style.zIndex = '350'
      coveragePane.style.mixBlendMode = 'lighten'
      coveragePane.style.pointerEvents = 'none'
    }

    layerGroupRef.current = L.layerGroup().addTo(map)
    coverageGroupRef.current = L.layerGroup({ pane: 'coveragePane' }).addTo(map)
    mapRef.current = map

    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [defaultCenter, defaultZoom])

  // Atualiza camada visual conforme o modo selecionado
  useEffect(() => {
    const map = mapRef.current
    const group = layerGroupRef.current
    const coverageGroup = coverageGroupRef.current
    if (!map || !group || !coverageGroup) return

    requestAnimationFrame(() => map.invalidateSize())

    group.clearLayers()
    coverageGroup.clearLayers()

    if (pontos.length === 0) {
      map.setView(defaultCenter, defaultZoom)
      return
    }

    const groups = groupBySatellite(pontos)
    const multi = groups.size > 1
    const allLatLngs: L.LatLngTuple[] = pontos.map((p) => [p.latitude, p.longitude])

    if (visualizationMode === 'fixed') {
      let idx = 0
      for (const [satId, satPontos] of groups) {
        const color = colorForSatellite(satId, idx)
        idx += 1
        const latlngs = satPontos.map((p) => [p.latitude, p.longitude] as L.LatLngTuple)

        L.polyline(latlngs, {
          color,
          weight: multi ? 4 : 3,
          opacity: 0.88,
        }).addTo(group)

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

      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40], maxZoom: multi ? 5 : 10 })
      return
    }

    for (const [satId, satPontos] of groups) {
      const amostra = subsamplePontos(satPontos, COVERAGE_MAX_FOOTPRINTS)

      amostra.forEach((p) => {
        const footprint = calcularFootprint(p.latitude, p.longitude, p.altitude_km)

        L.polygon(footprint, {
          pane: 'coveragePane',
          stroke: false,
          weight: 0,
          color: 'transparent',
          fillColor: COVERAGE_FILL,
          fillOpacity: 0.28,
          interactive: false,
        }).addTo(coverageGroup)
      })

      const ultimo = satPontos[satPontos.length - 1]
      if (ultimo) {
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

    const footprintBounds = pontos.flatMap((p) =>
      calcularFootprint(p.latitude, p.longitude, p.altitude_km),
    )
    const bounds = L.latLngBounds([...allLatLngs, ...footprintBounds])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: multi ? 5 : 10 })
  }, [pontos, sateliteId, visualizationMode, defaultCenter, defaultZoom])

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
      <div ref={containerRef} className={styles.mapContainer} />
    </div>
  )
}
