import { Search, MapPin } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useMapStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 md:left-20 md:translate-x-0 w-11/12 md:w-[400px] z-[900]">
      <div className="relative flex items-center w-full h-12 rounded-full focus-within:shadow-lg bg-white shadow-md overflow-hidden transition-shadow">
        <div className="grid place-items-center h-full w-12 text-gray-400">
          <Search size={20} />
        </div>

        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-transparent"
          type="text"
          id="search"
          placeholder="Pesquise no RPSBD..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <button className="grid place-items-center h-full w-12 text-blue-500 hover:bg-gray-50 transition-colors border-l border-gray-100">
          <MapPin size={20} />
        </button>
      </div>
    </div>
  );
}
