export type RouteStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface RouteLegendSatellite {
  id: string
  label: string
  color: string
  pointCount: number
}
