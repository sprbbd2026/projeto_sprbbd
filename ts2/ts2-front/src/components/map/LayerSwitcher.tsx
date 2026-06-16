import { Layers, Map, Mountain, LayoutGrid } from 'lucide-react';
import { useMapStore, type MapLayer } from '../../store/mapStore';

export function LayerSwitcher() {
  const { activeLayer, setActiveLayer } = useMapStore();

  const layers: { id: MapLayer; label: string; icon: React.ElementType }[] = [
    { id: 'streets', label: 'Padrão', icon: Map },
    { id: 'satellite', label: 'Satélite', icon: Layers },
    { id: 'terrain', label: 'Relevo', icon: Mountain },
    { id: 'carto', label: 'Básico', icon: LayoutGrid },
  ];

  return (
    <div className="absolute bottom-8 left-4 z-[900] group">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-1 flex transition-all duration-300">
        {layers.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex flex-col items-center justify-center rounded-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                isActive 
                  ? 'mx-1 w-14 h-14 md:w-16 md:h-16 bg-blue-50 border-2 border-blue-500 text-blue-700 opacity-100 px-2' 
                  : 'mx-0 w-0 h-14 md:h-16 opacity-0 px-0 border-0 group-hover:mx-1 group-hover:w-14 group-hover:md:w-16 group-hover:px-2 group-hover:opacity-100 group-hover:border-2 group-hover:border-transparent text-gray-600 hover:bg-white'
              }`}
            >
              <layer.icon size={20} className="mb-1 shrink-0" />
              <span className="text-[10px] font-medium whitespace-nowrap">{layer.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
