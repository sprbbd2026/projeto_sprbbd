/** Basemap compartilhado — Histórico e Rota (oceano configurável, terra cinza, sem rótulos). */

import L from 'leaflet'
import { DEFAULT_MAP_PREFERENCES, useMapPreferencesStore } from '../store/mapPreferencesStore'

export const BRAZIL_CENTER: [number, number] = [-14.2, -51.9]

export const MAP_OCEAN_COLOR = DEFAULT_MAP_PREFERENCES.oceanColor
export const MAP_LAND_COLOR = DEFAULT_MAP_PREFERENCES.landColor
export const MAP_LAND_BORDER_COLOR = DEFAULT_MAP_PREFERENCES.landBorderColor
export const MAP_LAND_BORDER_WEIGHT = 0.5

export const MAP_GEOJSON_URL = '/world-countries.geo.json'
export const MAP_ATTRIBUTION = '&copy; Natural Earth'

export const HISTORICO_MAP_ZOOM = DEFAULT_MAP_PREFERENCES.historicoMapZoom
export const ROUTE_MAP_ZOOM = DEFAULT_MAP_PREFERENCES.routeMapZoom
export const HISTORICO_MAP_AUTO_FIT = DEFAULT_MAP_PREFERENCES.historicoMapAutoFit
export const ROUTE_MAP_AUTO_FIT = DEFAULT_MAP_PREFERENCES.routeMapAutoFit

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

export const MAP_FIT_MAX_ZOOM_MULTI = 9
export const MAP_FIT_MAX_ZOOM_SINGLE = 11
export const ROUTE_FIT_MAX_ZOOM = 14

export const ROUTE_TRAIL_WEIGHT = DEFAULT_MAP_PREFERENCES.routeTrailWeight
export const ROUTE_DASH_WEIGHT = DEFAULT_MAP_PREFERENCES.routeDashWeight
export const ROUTE_DASH_ARRAY = '10 8'

export const HISTORICO_LINE_WEIGHT_MULTI = 1
export const HISTORICO_LINE_WEIGHT_SINGLE = 1

function prefs() {
  return useMapPreferencesStore.getState()
}

export function getMapOceanColor(): string {
  return prefs().oceanColor
}

export function getMapLandColor(): string {
  return prefs().landColor
}

export function getMapLandBorderColor(): string {
  return prefs().landBorderColor
}

export function getHistoricoMapZoom(): number {
  return prefs().historicoMapZoom
}

export function getRouteMapZoom(): number {
  return prefs().routeMapZoom
}

export function getHistoricoMapAutoFit(): boolean {
  return prefs().historicoMapAutoFit
}

export function getRouteMapAutoFit(): boolean {
  return prefs().routeMapAutoFit
}

export function getRouteTrailWeight(): number {
  return prefs().routeTrailWeight
}

export function getRouteDashWeight(): number {
  return prefs().routeDashWeight
}

/** Aplica zoom/center do Histórico conforme preferências. */
export function applyHistoricoMapView(map: L.Map, latlngs: L.LatLngTuple[], multi: boolean): void {
  const autoFit = getHistoricoMapAutoFit()
  const zoom = getHistoricoMapZoom()

  if (!autoFit || latlngs.length === 0) {
    map.setView(BRAZIL_CENTER, zoom, { animate: false })
    return
  }

  map.fitBounds(L.latLngBounds(latlngs).pad(0.15), {
    padding: [48, 48],
    maxZoom: multi ? MAP_FIT_MAX_ZOOM_MULTI : MAP_FIT_MAX_ZOOM_SINGLE,
    animate: false,
  })
}

/** Aplica zoom/center da Rota conforme preferências. */
export function applyRouteMapView(map: L.Map, latlngs: L.LatLngTuple[]): void {
  const autoFit = getRouteMapAutoFit()
  const zoom = getRouteMapZoom()

  if (!autoFit || latlngs.length === 0) {
    map.setView(BRAZIL_CENTER, zoom, { animate: false })
    return
  }

  map.fitBounds(L.latLngBounds(latlngs).pad(0.15), {
    padding: [48, 48],
    maxZoom: ROUTE_FIT_MAX_ZOOM,
    animate: false,
  })
}
