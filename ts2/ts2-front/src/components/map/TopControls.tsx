import { Search, MapPin, Utensils, Bed, Camera, Landmark, Bus, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMapStore } from '../../store/mapStore';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchResultCard } from './SearchResultCard';

interface SearchResult {
  type: 'location' | 'device' | 'street';
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
  subtitle?: string;
}

export function TopControls() {
  const searchQuery = useMapStore((state) => state.searchQuery);
  const setSearchQuery = useMapStore((state) => state.setSearchQuery);
  const activeFilters = useMapStore((state) => state.activeFilters);
  const toggleFilter = useMapStore((state) => state.toggleFilter);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);

  // Listen for marker clicks
  useEffect(() => {
    const handleMarkerClick = (event: Event) => {
      const customEvent = event as CustomEvent<SearchResult>;
      const result = customEvent.detail;

      // Navigate to the location
      window.dispatchEvent(new CustomEvent('map:navigate-to', {
        detail: { lat: result.lat, lng: result.lng },
      }));

      // Show the card
      setSelectedSearchResult(result);
    };

    window.addEventListener('map:marker-clicked', handleMarkerClick);
    return () => {
      window.removeEventListener('map:marker-clicked', handleMarkerClick);
    };
  }, []);

  const handleLocateCurrentPosition = () => {
    window.dispatchEvent(new Event('map:locate-current'));
  };

  const handleSelectLocation = (result: SearchResult) => {
    // First: navigate to the location
    window.dispatchEvent(new CustomEvent('map:navigate-to', {
      detail: { lat: result.lat, lng: result.lng },
    }));
    // Then: show the card with the result
    setSelectedSearchResult(result);
    setSearchQuery('');
    setIsSuggestionsOpen(false);
  };

  const filters = [
    { id: 'restaurantes', label: 'Restaurantes', icon: Utensils },
    { id: 'hoteis', label: 'Hotéis', icon: Bed },
    { id: 'coisas_fazer', label: 'Coisas legais', icon: Camera },
    { id: 'museus', label: 'Museus', icon: Landmark },
    { id: 'transporte', label: 'Transporte', icon: Bus },
    { id: 'outros', label: 'Outros', icon: HelpCircle },
  ];

  return (
    <>
      <div className="absolute top-4 left-16 right-4 z-900 flex flex-col gap-3 pointer-events-none md:left-20 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-87.5 pointer-events-auto">
          <div className="relative flex h-12 items-center overflow-hidden rounded-full bg-white shadow-md transition-shadow focus-within:shadow-lg">
            <div className="grid place-items-center h-full w-12 text-gray-400">
              <Search size={20} />
            </div>
            <input
              className="peer h-full flex-1 outline-none text-sm text-gray-700 pr-2 bg-transparent"
              type="text"
              placeholder="Pesquise no BDB-RPS..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSuggestionsOpen(true);
              }}
              onFocus={() => setIsSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 200)}
            />
            <button
              type="button"
              onClick={handleLocateCurrentPosition}
              className="grid place-items-center h-full w-12 text-blue-500 hover:bg-gray-50 transition-colors border-l border-gray-100"
              title="Minha localização atual"
            >
              <MapPin size={20} />
            </button>
          </div>
          <SearchSuggestions
            isOpen={isSuggestionsOpen}
            query={searchQuery}
            onSelectLocation={handleSelectLocation}
          />
        </div>

        {/* Filters (Atalhos) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto w-full md:w-auto pb-2 md:pb-0">
          {filters.map((filter) => {
            const isActive = activeFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-md transition-all ${isActive
                  ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <filter.icon size={16} className={isActive ? 'text-white' : 'text-blue-500'} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <SearchResultCard
        result={selectedSearchResult}
        onClose={() => setSelectedSearchResult(null)}
      />
    </>
  );
}
