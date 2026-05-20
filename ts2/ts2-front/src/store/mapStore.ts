import { create } from 'zustand';

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

interface MapState {
  activeLayer: MapLayer;
  searchQuery: string;
  activeFilters: string[];
  
  selectedCoord: { lat: number; lng: number } | null;
  isAddModalOpen: boolean;
  locations: LocationPoint[];
  
  setActiveLayer: (layer: MapLayer) => void;
  setSearchQuery: (query: string) => void;
  toggleFilter: (filter: string) => void;
  
  setSelectedCoord: (coord: { lat: number; lng: number } | null) => void;
  setAddModalOpen: (isOpen: boolean) => void;
  addLocation: (location: Omit<LocationPoint, 'id'>) => void;
}

export const useMapStore = create<MapState>((set) => ({
  activeLayer: 'streets',
  searchQuery: '',
  activeFilters: [],
  
  selectedCoord: null,
  isAddModalOpen: false,
  locations: [
    {
      id: '1',
      name: 'Restaurante Alpha',
      lat: -23.2081,
      lng: -45.8828,
      category: 'restaurantes',
      rating: 5,
    }
  ],
  
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleFilter: (filter) => set((state) => ({
    activeFilters: state.activeFilters.includes(filter)
      ? state.activeFilters.filter((f) => f !== filter)
      : [...state.activeFilters, filter]
  })),
  
  setSelectedCoord: (coord) => set({ selectedCoord: coord }),
  setAddModalOpen: (isOpen) => set({ isAddModalOpen: isOpen }),
  addLocation: (location) => set((state) => ({
    locations: [...state.locations, { ...location, id: Date.now().toString() }],
    selectedCoord: null,
    isAddModalOpen: false
  }))
}));
