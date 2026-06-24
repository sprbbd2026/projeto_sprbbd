import L from 'leaflet'
import {
  MAP_GEOJSON_URL,
  MAP_LAND_BORDER_COLOR,
  MAP_LAND_BORDER_WEIGHT,
  MAP_LAND_COLOR,
  MAP_OCEAN_COLOR,
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
  const container = map.getContainer()
  container.style.backgroundColor = MAP_OCEAN_COLOR
  container.style.setProperty('--map-ocean-color', MAP_OCEAN_COLOR)
  container.style.setProperty('--map-land-color', MAP_LAND_COLOR)
  container.style.setProperty('--map-land-border-color', MAP_LAND_BORDER_COLOR)

  const tilePane = map.getPane('tilePane')
  if (tilePane) tilePane.style.background = 'transparent'
}

export function createLandGeoJsonLayer(data: WorldGeoJson): L.GeoJSON {
  return L.geoJSON(data, {
    interactive: false,
    className: 'sprb-land-layer',
    style: () => ({
      fillColor: MAP_LAND_COLOR,
      fillOpacity: 1,
      color: MAP_LAND_BORDER_COLOR,
      weight: MAP_LAND_BORDER_WEIGHT,
    }),
  })
}

/** Oceano = fundo vermelho; terra = polígonos GeoJSON. */
export async function attachSprbGeoBasemap(map: L.Map): Promise<L.GeoJSON> {
  applyOceanBackground(map)
  const data = await loadMapGeoJson()
  const layer = createLandGeoJsonLayer(data)
  layer.addTo(map)
  return layer
}
