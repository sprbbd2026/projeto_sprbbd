import { Utensils, Bed, Camera, Landmark, Bus } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

export function FilterBar() {
  const { activeFilters, toggleFilter } = useMapStore();

  const filters = [
    { id: 'restaurantes', label: 'Restaurantes', icon: Utensils },
    { id: 'hoteis', label: 'Hotéis', icon: Bed },
    { id: 'coisas_fazer', label: 'Coisas legais', icon: Camera },
    { id: 'museus', label: 'Museus', icon: Landmark },
    { id: 'transporte', label: 'Transporte', icon: Bus },
  ];

  return (
    <div className="absolute top-20 left-4 md:left-20 right-4 z-[900] overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-2 w-max">
        {filters.map((filter) => {
          const isActive = activeFilters.includes(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm border transition-all ${
                isActive 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <filter.icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
