import { create } from 'zustand';
import { fetchSatelites } from '../services/satelliteService';

export type MapLayer = 'streets' | 'satellite' | 'terrain' | 'carto';

export interface SatellitePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  operational: boolean;
}

interface MapState {
  activeLayer: MapLayer;
  selectedCoord: { lat: number; lng: number } | null;
  satellites: SatellitePoint[];
  isLoading: boolean;
  error: string | null;

  setActiveLayer: (layer: MapLayer) => void;
  setSelectedCoord: (coord: { lat: number; lng: number } | null) => void;
  fetchSatellites: () => Promise<void>;
}

export const useMapStore = create<MapState>((set) => ({
  activeLayer: 'streets',
  selectedCoord: null,
  satellites: [],
  isLoading: false,
  error: null,

  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSelectedCoord: (coord) => set({ selectedCoord: coord }),

  fetchSatellites: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchSatelites();
      set({ satellites: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar satelites', isLoading: false });
    }
  },
}));
