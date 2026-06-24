import { GeoJSON, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MAP_ATTRIBUTION, MAP_LAND_BORDER_COLOR, MAP_LAND_BORDER_WEIGHT, MAP_LAND_COLOR } from '../../utils/mapBasemap'
import { applyOceanBackground, loadMapGeoJson } from '../../utils/sprbGeoBasemap'
import './mapBasemap.module.css'

function SprbOceanBackground() {
  const map = useMap()

  useEffect(() => {
    applyOceanBackground(map)
  }, [map])

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
          data={data}
          className="sprb-land-layer"
          pathOptions={{
            fillColor: MAP_LAND_COLOR,
            fillOpacity: 1,
            color: MAP_LAND_BORDER_COLOR,
            weight: MAP_LAND_BORDER_WEIGHT,
          }}
          style={() => ({
            fillColor: MAP_LAND_COLOR,
            fillOpacity: 1,
            color: MAP_LAND_BORDER_COLOR,
            weight: MAP_LAND_BORDER_WEIGHT,
          })}
        />
      ) : null}
    </>
  )
}
