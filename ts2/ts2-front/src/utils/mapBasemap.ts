/** Basemap compartilhado — Histórico e Rota (oceano configurável, terra cinza, sem rótulos). */

import L from 'leaflet'

export const BRAZIL_CENTER: [number, number] = [-14.2, -51.9]

/** Cor do oceano (fundo do mapa — áreas sem polígono de terra). */
export const MAP_OCEAN_COLOR = '#2a2a2a'

/** Cor dos continentes/países (camada GeoJSON). */
export const MAP_LAND_COLOR = '#cccccc'

export const MAP_LAND_BORDER_COLOR = '#ffffff'
export const MAP_LAND_BORDER_WEIGHT = 0.5

export const MAP_GEOJSON_URL = '/world-countries.geo.json'

export const MAP_ATTRIBUTION = '&copy; Natural Earth'

/** Zoom fixo — aba Histórico (pontos fixos e cobertura). */
export const HISTORICO_MAP_ZOOM = 3

/** Zoom fixo — aba Rota. */
export const ROUTE_MAP_ZOOM = 3

/**
 * true = ajusta center/zoom aos dados (fitBounds).
 * false = mantém BRAZIL_CENTER + HISTORICO_MAP_ZOOM ao filtrar ou alternar cobertura.
 */
export const HISTORICO_MAP_AUTO_FIT = false

/** true = enquadra rota nos dados; false = mantém ROUTE_MAP_ZOOM fixo. */
export const ROUTE_MAP_AUTO_FIT = false

/** @deprecated Preferir HISTORICO_MAP_ZOOM */
export const BRAZIL_ZOOM = HISTORICO_MAP_ZOOM

/** @deprecated Preferir ROUTE_MAP_ZOOM */
export const ROUTE_INITIAL_ZOOM = ROUTE_MAP_ZOOM

export const MAP_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'

/** @deprecated Basemap usa GeoJSON; mantido apenas para referência. */
export const MAP_TILE_ATTRIBUTION = MAP_ATTRIBUTION

export const MAP_TILE_OPTIONS = {
  attribution: MAP_TILE_ATTRIBUTION,
  maxZoom: 19,
  subdomains: 'abcd' as const,
}

/** fitBounds — Histórico */
export const MAP_FIT_MAX_ZOOM_MULTI = 9
export const MAP_FIT_MAX_ZOOM_SINGLE = 11

/** fitBounds — Rota */
export const ROUTE_FIT_MAX_ZOOM = 14

/** Espessura das linhas de rota/trilha */
export const ROUTE_TRAIL_WEIGHT = 1
export const ROUTE_DASH_WEIGHT = 1
export const ROUTE_DASH_ARRAY = '10 8'

/** Espessura — Histórico (modo pontos fixos) */
export const HISTORICO_LINE_WEIGHT_MULTI = 1
export const HISTORICO_LINE_WEIGHT_SINGLE = 1

/** Aplica zoom/center do Histórico conforme HISTORICO_MAP_AUTO_FIT. */
export function applyHistoricoMapView(map: L.Map, latlngs: L.LatLngTuple[], multi: boolean): void {
  if (!HISTORICO_MAP_AUTO_FIT || latlngs.length === 0) {
    map.setView(BRAZIL_CENTER, HISTORICO_MAP_ZOOM, { animate: false })
    return
  }

  map.fitBounds(L.latLngBounds(latlngs).pad(0.15), {
    padding: [48, 48],
    maxZoom: multi ? MAP_FIT_MAX_ZOOM_MULTI : MAP_FIT_MAX_ZOOM_SINGLE,
    animate: false,
  })
}

/** Aplica zoom/center da Rota conforme ROUTE_MAP_AUTO_FIT. */
export function applyRouteMapView(map: L.Map, latlngs: L.LatLngTuple[]): void {
  if (!ROUTE_MAP_AUTO_FIT || latlngs.length === 0) {
    map.setView(BRAZIL_CENTER, ROUTE_MAP_ZOOM, { animate: false })
    return
  }

  map.fitBounds(L.latLngBounds(latlngs).pad(0.15), {
    padding: [48, 48],
    maxZoom: ROUTE_FIT_MAX_ZOOM,
    animate: false,
  })
}
