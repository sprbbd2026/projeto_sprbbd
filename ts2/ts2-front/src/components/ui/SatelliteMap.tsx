/* ================================================================
   SatelliteMap — componente de mapa Leaflet para US303
   Exibe pontos e polyline do histórico de localização de um satélite
   ================================================================ */

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Localizacao } from '../../types/localizacao'
import styles from './SatelliteMap.module.css'

// Corrige o ícone padrão do Leaflet com Vite/Webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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

interface SatelliteMapProps {
  pontos: Localizacao[]
  sateliteId: string
}

export default function SatelliteMap({ pontos, sateliteId }: SatelliteMapProps) {
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

  // Atualiza camada de pontos/trilha ao receber novos dados
  useEffect(() => {
    const map = mapRef.current
    const group = layerGroupRef.current
    if (!map || !group) return

    group.clearLayers()

    if (pontos.length === 0) return

    const latlngs: L.LatLngTuple[] = pontos.map((p) => [p.latitude, p.longitude])

    // Polyline (trilha)
    L.polyline(latlngs, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.85,
      dashArray: undefined,
    }).addTo(group)

    // Marcadores intermediários (pontos menores)
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
        `<strong>${sateliteId}</strong><br/>
         Lat: ${p.latitude.toFixed(5)}, Lon: ${p.longitude.toFixed(5)}
         ${altitude}${velocidade}<br/>
         <em>${dataHora}</em>`
      )
      marker.addTo(group)
    })

    // Ajusta zoom para cobrir todos os pontos
    const bounds = L.latLngBounds(latlngs)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
  }, [pontos, sateliteId])

  return <div ref={containerRef} className={styles.mapContainer} />
}
