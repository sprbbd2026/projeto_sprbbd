import { X, MapPin, Star, Navigation } from 'lucide-react';

interface SearchResultCardProps {
  result: {
    type: 'location' | 'device' | 'street';
    name: string;
    lat: number;
    lng: number;
    category?: string;
    subtitle?: string;
  } | null;
  onClose: () => void;
}

export function SearchResultCard({ result, onClose }: SearchResultCardProps) {
  if (!result) return null;

  const categoryIcons: { [key: string]: string } = {
    restaurantes: '🍽️',
    hoteis: '🏨',
    museus: '🏛️',
    coisas_fazer: '📷',
    transporte: '🚌',
    street: '🛣️',
    outros: '📍',
  };

  const icon = categoryIcons[result.category || result.type || 'outros'] || '📍';

  return (
    <div className="absolute left-4 top-20 md:left-20 md:top-24 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-40 pointer-events-auto overflow-hidden">
      {/* Header with background gradient */}
      <div className="bg-linear-to-r from-blue-600 to-blue-500 h-24 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 rounded-full p-1 transition-all"
        >
          <X size={20} />
        </button>
        <div className="absolute bottom-3 left-4 text-4xl">{icon}</div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{result.name}</h2>
        {result.category && (
          <p className="text-sm text-gray-600 capitalize mb-3">{result.category}</p>
        )}
        {!result.category && result.subtitle && (
          <p className="text-sm text-gray-600 mb-3">{result.subtitle}</p>
        )}

        {/* Rating placeholder */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className="fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">(12 avaliações)</span>
        </div>

        {/* Coordinates */}
        <div className="bg-gray-50 rounded p-3 mb-4 border border-gray-100">
          <p className="text-xs text-gray-600 font-mono">
            📍 {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
          </p>
        </div>

        {/* Distance info */}
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
          <Navigation size={16} className="text-blue-600" />
          <span>Abrir com navegador</span>
        </div>

        {/* Action button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
          <MapPin size={18} />
          Instruções
        </button>

        {/* Share/More options */}
        <div className="flex gap-2 mt-3">
          <button className="flex-1 text-sm text-gray-700 hover:bg-gray-50 py-2 rounded transition-colors border border-gray-200">
            Compartilhar
          </button>
          <button className="flex-1 text-sm text-gray-700 hover:bg-gray-50 py-2 rounded transition-colors border border-gray-200">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
