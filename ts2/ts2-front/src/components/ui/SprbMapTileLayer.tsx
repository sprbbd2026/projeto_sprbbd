import { useEffect, useState } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MAP_ATTRIBUTION } from '../../utils/mapBasemap'
import { applyOceanBackground, loadMapGeoJson } from '../../utils/sprbGeoBasemap'
import { useMapPreferencesStore } from '../../store/mapPreferencesStore'
import './mapBasemap.module.css'

function SprbOceanBackground() {
  const map = useMap()
  const oceanColor = useMapPreferencesStore((s) => s.oceanColor)
  const landColor = useMapPreferencesStore((s) => s.landColor)
  const landBorderColor = useMapPreferencesStore((s) => s.landBorderColor)

  useEffect(() => {
    applyOceanBackground(map)
  }, [map, oceanColor, landColor, landBorderColor])

  return null
}

function SprbAttribution() {
  const map = useMap()

  useEffect(() => {
    const control = L.control.attribution({ prefix: false }).addAttribution(MAP_ATTRIBUTION)
    control.addTo(map)
    return () => {
      control.remove()
    }
  }, [map])

  return null
}

export function SprbMapTileLayer() {
  const [data, setData] = useState<GeoJSON.GeoJsonObject | null>(null)
  const landColor = useMapPreferencesStore((s) => s.landColor)
  const landBorderColor = useMapPreferencesStore((s) => s.landBorderColor)

  useEffect(() => {
    loadMapGeoJson()
      .then(setData)
      .catch((error: unknown) => {
        console.error('Erro ao carregar basemap GeoJSON:', error)
      })
  }, [])

  return (
    <>
      <SprbOceanBackground />
      <SprbAttribution />
      {data ? (
        <GeoJSON
          key={`${landColor}-${landBorderColor}`}
          data={data}
          pathOptions={{
            fillColor: landColor,
            fillOpacity: 1,
            color: landBorderColor,
            weight: 0.5,
          }}
          style={() => ({
            fillColor: landColor,
            fillOpacity: 1,
            color: landBorderColor,
            weight: 0.5,
          })}
        />
      ) : null}
    </>
  )
}
