import { useMapStore } from '../../store/mapStore';
import { X, Plus, MapPin } from 'lucide-react';

export function SelectedPointCardDashboard() {
  const { selectedCoord, setSelectedCoord, setAddModalOpen } = useMapStore();

  if (!selectedCoord) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-sm animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Local Selecionado</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {selectedCoord.lat.toFixed(4)}, {selectedCoord.lng.toFixed(4)}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedCoord(null)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
