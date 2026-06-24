import L from 'leaflet'
import {
  getMapLandBorderColor,
  getMapLandColor,
  getMapOceanColor,
  MAP_GEOJSON_URL,
  MAP_LAND_BORDER_WEIGHT,
} from './mapBasemap'

type WorldGeoJson = GeoJSON.GeoJsonObject

let geoJsonPromise: Promise<WorldGeoJson> | null = null

export function loadMapGeoJson(): Promise<WorldGeoJson> {
  if (!geoJsonPromise) {
    geoJsonPromise = fetch(MAP_GEOJSON_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Falha ao carregar mapa GeoJSON (${response.status})`)
      }
      return response.json() as Promise<WorldGeoJson>
    })
  }
  return geoJsonPromise
}

export function applyOceanBackground(map: L.Map): void {
  const oceanColor = getMapOceanColor()
  const landColor = getMapLandColor()
  const landBorderColor = getMapLandBorderColor()
  const container = map.getContainer()
  container.style.backgroundColor = oceanColor
  container.style.setProperty('--map-ocean-color', oceanColor)
  container.style.setProperty('--map-land-color', landColor)
  container.style.setProperty('--map-land-border-color', landBorderColor)

  const tilePane = map.getPane('tilePane')
  if (tilePane) tilePane.style.background = 'transparent'
}

export function createLandGeoJsonLayer(data: WorldGeoJson): L.GeoJSON {
  const landColor = getMapLandColor()
  const landBorderColor = getMapLandBorderColor()
  return L.geoJSON(data, {
    interactive: false,
    style: () => ({
      fillColor: landColor,
      fillOpacity: 1,
      color: landBorderColor,
      weight: MAP_LAND_BORDER_WEIGHT,
    }),
  })
}

export function updateLandGeoJsonStyle(layer: L.GeoJSON): void {
  const landColor = getMapLandColor()
  const landBorderColor = getMapLandBorderColor()
  layer.setStyle(() => ({
    fillColor: landColor,
    fillOpacity: 1,
    color: landBorderColor,
    weight: MAP_LAND_BORDER_WEIGHT,
  }))
}

/** Oceano = fundo vermelho; terra = polígonos GeoJSON. */
export async function attachSprbGeoBasemap(map: L.Map): Promise<L.GeoJSON> {
  applyOceanBackground(map)
  const data = await loadMapGeoJson()
  const layer = createLandGeoJsonLayer(data)
  layer.addTo(map)
  return layer
}
