import type { FootprintFeatureCollection } from '../services/coberturaService'
import type { LatLngTuple } from './routeProjection'

function ringToLatLng(ring: number[][]): LatLngTuple[] {
  return ring.map(([lng, lat]) => [lat, lng])
}

export function extractFootprintsFromFeatureCollection(
  collection: FootprintFeatureCollection,
): LatLngTuple[][] {
  const footprints: LatLngTuple[][] = []

  for (const feature of collection.features) {
    const geometry = feature.geometry
    if (!geometry) continue

    if (geometry.type === 'Polygon') {
      const ring = geometry.coordinates[0] as number[][] | undefined
      if (ring?.length) footprints.push(ringToLatLng(ring))
      continue
    }

    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates as number[][][][]) {
        const ring = polygon[0]
        if (ring?.length) footprints.push(ringToLatLng(ring))
      }
    }
  }

  return footprints
}
