import { Search, MapPin, Utensils, Bed, Camera, Landmark, Bus, HelpCircle } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

export function TopControls() {
  const { searchQuery, setSearchQuery, activeFilters, toggleFilter } = useMapStore();

  const filters = [
    { id: 'restaurantes', label: 'Restaurantes', icon: Utensils },
    { id: 'hoteis', label: 'Hotéis', icon: Bed },
    { id: 'coisas_fazer', label: 'Coisas legais', icon: Camera },
    { id: 'museus', label: 'Museus', icon: Landmark },
    { id: 'transporte', label: 'Transporte', icon: Bus },
    { id: 'outros', label: 'Outros', icon: HelpCircle },
  ];

  return (
    <div className="absolute top-4 left-16 md:left-20 right-4 z-[900] flex flex-col md:flex-row gap-3 items-start md:items-center pointer-events-none">
      {/* Search Input */}
      <div className="flex-shrink-0 w-full md:w-[350px] relative flex items-center h-12 rounded-full focus-within:shadow-lg bg-white shadow-md overflow-hidden transition-shadow pointer-events-auto">
        <div className="grid place-items-center h-full w-12 text-gray-400">
          <Search size={20} />
        </div>
        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-transparent"
          type="text"
          placeholder="Pesquise no BDB-RPS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="grid place-items-center h-full w-12 text-blue-500 hover:bg-gray-50 transition-colors border-l border-gray-100">
          <MapPin size={20} />
        </button>
      </div>

      {/* Filters (Atalhos) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto w-full md:w-auto pb-2 md:pb-0">
        {filters.map((filter) => {
          const isActive = activeFilters.includes(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-md transition-all ${
                isActive 
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
  );
}
