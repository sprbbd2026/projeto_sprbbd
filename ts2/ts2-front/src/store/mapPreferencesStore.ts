import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SatelliteColorMode = 'auto' | 'custom'

export type MapPreferences = {
  oceanColor: string
  landColor: string
  landBorderColor: string
  historicoMapZoom: number
  routeMapZoom: number
  historicoMapAutoFit: boolean
  routeMapAutoFit: boolean
  routeTrailWeight: number
  routeDashWeight: number
  dashboardPollIntervalMs: number
  satelliteColorMode: SatelliteColorMode
  satelliteCustomColors: Record<string, string>
}

export const DEFAULT_MAP_PREFERENCES: MapPreferences = {
  oceanColor: '#2a2a2a',
  landColor: '#cccccc',
  landBorderColor: '#ffffff',
  historicoMapZoom: 3,
  routeMapZoom: 3,
  historicoMapAutoFit: false,
  routeMapAutoFit: false,
  routeTrailWeight: 1,
  routeDashWeight: 1,
  dashboardPollIntervalMs: 30_000,
  satelliteColorMode: 'auto',
  satelliteCustomColors: {},
}

type MapPreferencesState = MapPreferences & {
  setPreference: <K extends keyof MapPreferences>(key: K, value: MapPreferences[K]) => void
  setSatelliteColor: (satelliteId: string | number, color: string) => void
  clearSatelliteColor: (satelliteId: string | number) => void
  setSatelliteColorMode: (mode: SatelliteColorMode) => void
  resetToDefaults: () => void
}

export const useMapPreferencesStore = create<MapPreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_MAP_PREFERENCES,

      setPreference: (key, value) => set({ [key]: value }),

      setSatelliteColor: (satelliteId, color) =>
        set((state) => ({
          satelliteColorMode: 'custom',
          satelliteCustomColors: {
            ...state.satelliteCustomColors,
            [String(satelliteId)]: color,
          },
        })),

      clearSatelliteColor: (satelliteId) =>
        set((state) => {
          const next = { ...state.satelliteCustomColors }
          delete next[String(satelliteId)]
          return { satelliteCustomColors: next }
        }),

      setSatelliteColorMode: (mode) => set({ satelliteColorMode: mode }),

      resetToDefaults: () => set({ ...DEFAULT_MAP_PREFERENCES }),
    }),
    { name: 'sprb-map-preferences' },
  ),
)
