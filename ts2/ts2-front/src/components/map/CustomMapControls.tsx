import { useMap } from 'react-leaflet';
import { Plus, Minus, LocateFixed } from 'lucide-react';

export function CustomMapControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleLocate = () => {
    map.locate().on('locationfound', function (e) {
      map.flyTo(e.latlng, map.getZoom());
    });
  };

  return (
    <div className="absolute bottom-8 right-4 z-[900] flex flex-col gap-3">
      {/* Locate Button */}
      <button 
        onClick={handleLocate}
        className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
        title="Minha Localização"
      >
        <LocateFixed size={20} />
      </button>

      {/* Zoom Controls Container */}
      <div className="bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
        <button 
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer"
          title="Aumentar Zoom"
        >
          <Plus size={20} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
          title="Diminuir Zoom"
        >
          <Minus size={20} />
        </button>
      </div>
    </div>
  );
}
