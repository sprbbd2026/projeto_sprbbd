import { create } from 'zustand';
import { fetchLocais, createLocal } from '../services/localService';
import { fetchSatelites, getCoberturaConstelacao } from '../services/satelliteService';

export type MapLayer = 'streets' | 'satellite' | 'terrain' | 'carto';
export type LocationCategory = 'restaurantes' | 'hoteis' | 'museus' | 'coisas_fazer' | 'transporte' | 'outros';

export interface LocationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: LocationCategory;
  rating: number; // 1 to 5
}

export interface SatellitePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  operational: boolean;
}

interface MapState {
  activeLayer: MapLayer;
  searchQuery: string;
  activeFilters: string[];
  
  selectedCoord: { lat: number; lng: number } | null;
  isAddModalOpen: boolean;
  locations: LocationPoint[];
  satellites: SatellitePoint[];
  isLoading: boolean;
  error: string | null;
  
  setActiveLayer: (layer: MapLayer) => void;
  setSearchQuery: (query: string) => void;
  toggleFilter: (filter: string) => void;
  
  setSelectedCoord: (coord: { lat: number; lng: number } | null) => void;
  setAddModalOpen: (isOpen: boolean) => void;
  fetchLocations: () => Promise<void>;
  fetchSatellites: () => Promise<void>;
  addLocation: (location: Omit<LocationPoint, 'id'>) => Promise<void>;
  showCoverage: boolean;
  coverageData: any | null;
  setShowCoverage: (show: boolean) => void;
  fetchCoverage: (constellationId: number) => Promise<void>;
}

export const useMapStore = create<MapState>((set) => ({
  activeLayer: 'streets',
  searchQuery: '',
  activeFilters: [],
  
  selectedCoord: null,
  isAddModalOpen: false,
  locations: [],
  isLoading: false,
  error: null,
  satellites: [],
  showCoverage: false,
  coverageData: null,
  
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleFilter: (filter) => set((state) => ({
    activeFilters: state.activeFilters.includes(filter)
      ? state.activeFilters.filter((f) => f !== filter)
      : [...state.activeFilters, filter]
  })),
  
  setSelectedCoord: (coord) => set({ selectedCoord: coord }),
  setAddModalOpen: (isOpen) => set({ isAddModalOpen: isOpen }),
  
  fetchLocations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchLocais();
      set({ locations: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar locais', isLoading: false });
    }
  },

  fetchSatellites: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchSatelites();
      set({ satellites: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar locais', isLoading: false });
    }
  },
  
  addLocation: async (location) => {
    set({ isLoading: true, error: null });
    try {
      const newLoc = await createLocal({
        nome: location.name,
        lat: location.lat,
        lng: location.lng,
        categoria: location.category,
        rating: location.rating,
      });
      set((state) => ({
        locations: [...state.locations, newLoc],
        selectedCoord: null,
        isAddModalOpen: false,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar local', isLoading: false });
    }
  },
  
  setShowCoverage: (show) => set({ showCoverage: show }),
  
  fetchCoverage: async (constellationId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getCoberturaConstelacao(constellationId);
      set({ coverageData: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar cobertura', isLoading: false });
    }
  }
}));
