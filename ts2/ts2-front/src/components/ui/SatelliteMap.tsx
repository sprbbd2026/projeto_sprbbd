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
import styles from './SatelliteMap.module.css'

// Corrige o ícone padrão do Leaflet com Vite/Webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ANGULO_ELEVACAO_MIN = (5 * Math.PI) / 180

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

function calcularFootprint(lat: number, lng: number, altKm?: number) {
  const R = 6371
  const altura = altKm ?? 512
  const rho = Math.acos(R / (R + altura)) - ANGULO_ELEVACAO_MIN
  const pontos: L.LatLngTuple[] = []

  for (let k = 0; k <= 48; k++) {
    const az = (k * 2 * Math.PI) / 48
    const latR = (lat * Math.PI) / 180
    const lngR = (lng * Math.PI) / 180

    const latP = Math.asin(
      Math.sin(latR) * Math.cos(rho) +
      Math.cos(latR) * Math.sin(rho) * Math.cos(az)
    )

    const lngP = lngR + Math.atan2(
      Math.sin(az) * Math.sin(rho) * Math.cos(latR),
      Math.cos(rho) - Math.sin(latR) * Math.sin(latP)
    )

    pontos.push([(latP * 180) / Math.PI, (lngP * 180) / Math.PI])
  }

  return pontos
}

interface SatelliteMapProps {
  pontos: Localizacao[]
  sateliteId: string
  visualizationMode: 'fixed' | 'coverage'
  onToggleVisualization: () => void
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

export default function SatelliteMap({ pontos, sateliteId, visualizationMode, onToggleVisualization }: SatelliteMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  // Inicializa o mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [0, 0],
      zoom: 2,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    layerGroupRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Atualiza camada visual conforme o modo selecionado
  useEffect(() => {
    const map = mapRef.current
    const group = layerGroupRef.current
    if (!map || !group) return

    group.clearLayers()

    if (pontos.length === 0) return

    const latlngs: L.LatLngTuple[] = pontos.map((p) => [p.latitude, p.longitude])

    if (visualizationMode === 'fixed') {
      L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.85,
      }).addTo(group)

      pontos.forEach((p, i) => {
        const isFirst = i === 0
        const isLast = i === pontos.length - 1

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
        const altitude = p.altitude_km != null ? `<br/>Altitude: ${p.altitude_km.toFixed(1)} km` : ''
        const velocidade = p.velocidade_kmh != null ? `<br/>Velocidade: ${p.velocidade_kmh.toFixed(1)} km/h` : ''

        marker.bindPopup(
          `<strong>Satélite ${sateliteId}</strong><br/>
           Lat: ${p.latitude.toFixed(5)}, Lon: ${p.longitude.toFixed(5)}
           ${altitude}${velocidade}<br/>
           <em>${dataHora}</em>`
        )
        marker.addTo(group)
      })

      const bounds = L.latLngBounds(latlngs)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
      return
    }

    pontos.forEach((p, i) => {
      const footprint = calcularFootprint(p.latitude, p.longitude, p.altitude_km)
      const isFirst = i === 0
      const isLast = i === pontos.length - 1
      const alpha = isLast ? 0.32 : isFirst ? 0.18 : 0.12

      L.polygon(footprint, {
        color: '#2563eb',
        weight: 1.5,
        opacity: 0.85,
        fillColor: '#60a5fa',
        fillOpacity: alpha,
      }).addTo(group)

      const marker = L.marker([p.latitude, p.longitude], {
        icon: satelliteIcon,
      })

      const dataHora = new Date(p.data_hora).toLocaleString('pt-BR')
      const altitude = p.altitude_km != null ? `<br/>Altitude: ${p.altitude_km.toFixed(1)} km` : ''
      const velocidade = p.velocidade_kmh != null ? `<br/>Velocidade: ${p.velocidade_kmh.toFixed(1)} km/h` : ''

      marker.bindPopup(
        `<strong>Satélite ${sateliteId}</strong><br/>
         Lat: ${p.latitude.toFixed(5)}, Lon: ${p.longitude.toFixed(5)}
         ${altitude}${velocidade}<br/>
         <em>${dataHora}</em>`
      )
      marker.addTo(group)
    })

    // Ajusta zoom para cobrir todos os footprints e pontos
    const footprintBounds = pontos.flatMap((p) => calcularFootprint(p.latitude, p.longitude, p.altitude_km))
    const bounds = L.latLngBounds([...latlngs, ...footprintBounds])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
  }, [pontos, sateliteId, visualizationMode])

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
