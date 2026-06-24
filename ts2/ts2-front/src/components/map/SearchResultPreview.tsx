import { X, MapPin } from 'lucide-react';

interface SearchResultPreviewProps {
  result: {
    type: 'location' | 'device';
    name: string;
    lat: number;
    lng: number;
    category?: string;
  } | null;
  onClose: () => void;
  onNavigate: () => void;
}

export function SearchResultPreview({ result, onClose, onNavigate }: SearchResultPreviewProps) {
  if (!result) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-20 md:bottom-6 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 pointer-events-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-blue-600 shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate">{result.name}</h3>
          </div>
          {result.category && (
            <p className="text-sm text-gray-600 mb-2 capitalize">{result.category}</p>
          )}
          <p className="text-xs text-gray-500 font-mono">
            {result.lat.toFixed(4)}°, {result.lng.toFixed(4)}°
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      <button
        onClick={onNavigate}
        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
      >
        Ir para este local
      </button>
    </div>
  );
}
