import { useMap } from 'react-leaflet';
import { Plus, Minus, Crosshair } from 'lucide-react';

export function CustomMapControls() {
  const map = useMap();

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition"
      >
        <Plus size={18} className="text-gray-700" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition"
      >
        <Minus size={18} className="text-gray-700" />
      </button>
      <button
        onClick={() => map.locate({ setView: true, maxZoom: 13 })}
        className="w-9 h-9 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition"
      >
        <Crosshair size={18} className="text-gray-700" />
      </button>
    </div>
  );
}
