import { X, Star, Navigation, Route } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

interface SearchResultCardProps {
  result: {
    type: 'location' | 'device' | 'street' | 'poi';
    id?: string;
    name: string;
    lat: number;
    lng: number;
    category?: string;
    subtitle?: string;
  } | null;
  onClose: () => void;
}

export function SearchResultCard({ result, onClose }: SearchResultCardProps) {
  const openRoutePanel = useMapStore((state) => state.openRoutePanel);

  if (!result) return null;

  const hash = (text: string) => {
    let h = 0;
    for (let i = 0; i < text.length; i += 1) {
      h = (h * 31 + text.charCodeAt(i)) >>> 0;
    }
    return h;
  };

  const seed = hash(`${result.id || result.name}-${result.type}`);
  const normalized = (seed % 1000) / 1000;
  const rangeValue = (min: number, max: number) => min + normalized * (max - min);

  const categoryLabel = result.category || (result.type === 'street' ? 'Rua' : result.type === 'device' ? 'Dispositivo' : 'Local');

  const metricsByCategory: Record<string, { ratingMin: number; ratingMax: number; reviewsMin: number; reviewsMax: number; prices: string[]; status: string[] }> = {
    Mercado: { ratingMin: 3.9, ratingMax: 4.8, reviewsMin: 120, reviewsMax: 460, prices: ['$', '$$'], status: ['Aberto agora', 'Movimento moderado'] },
    Shopping: { ratingMin: 4.1, ratingMax: 4.9, reviewsMin: 150, reviewsMax: 520, prices: ['$$', '$$$'], status: ['Aberto agora', 'Bastante movimento'] },
    Restaurante: { ratingMin: 3.8, ratingMax: 4.9, reviewsMin: 80, reviewsMax: 380, prices: ['$$', '$$$'], status: ['Aberto agora', 'Pico entre 12h e 14h'] },
    Hospedagem: { ratingMin: 4.0, ratingMax: 4.9, reviewsMin: 40, reviewsMax: 220, prices: ['$$', '$$$'], status: ['Recepção 24h', 'Fluxo tranquilo'] },
    Museu: { ratingMin: 3.7, ratingMax: 4.8, reviewsMin: 25, reviewsMax: 160, prices: ['$', '$$'], status: ['Aberto hoje', 'Movimento baixo'] },
    Transporte: { ratingMin: 3.6, ratingMax: 4.6, reviewsMin: 30, reviewsMax: 180, prices: ['$', '$$'], status: ['Em operação', 'Fluxo intenso'] },
    Saúde: { ratingMin: 4.2, ratingMax: 4.9, reviewsMin: 50, reviewsMax: 280, prices: ['$$', '$$$'], status: ['Aberto agora', 'Atendimento disponível'] },
    Educação: { ratingMin: 3.9, ratingMax: 4.8, reviewsMin: 60, reviewsMax: 310, prices: ['$$'], status: ['Em funcionamento', 'Horário regular'] },
    Lazer: { ratingMin: 3.8, ratingMax: 4.7, reviewsMin: 40, reviewsMax: 200, prices: ['$', '$$'], status: ['Aberto agora', 'Movimento variável'] },
    Rua: { ratingMin: 3.9, ratingMax: 4.6, reviewsMin: 8, reviewsMax: 45, prices: ['-'], status: ['Via principal', 'Trânsito variável'] },
    Dispositivo: { ratingMin: 4.0, ratingMax: 4.8, reviewsMin: 5, reviewsMax: 30, prices: ['-'], status: ['Atualizado agora', 'Sinal estável'] },
    Local: { ratingMin: 3.7, ratingMax: 4.7, reviewsMin: 12, reviewsMax: 110, prices: ['$', '$$'], status: ['Disponível', 'Movimento normal'] },
  };

  const metrics = metricsByCategory[categoryLabel] || metricsByCategory.Local;
  const rating = Number(rangeValue(metrics.ratingMin, metrics.ratingMax).toFixed(1));
  const reviews = Math.round(rangeValue(metrics.reviewsMin, metrics.reviewsMax));
  const price = metrics.prices[seed % metrics.prices.length];
  const status = metrics.status[seed % metrics.status.length];
  const starsFilled = Math.max(1, Math.min(5, Math.round(rating)));

  const categoryIcons: { [key: string]: string } = {
    restaurantes: '🍽️',
    hoteis: '🏨',
    museus: '🏛️',
    coisas_fazer: '📷',
    transporte: '🚌',
    Mercado: '🛒',
    Shopping: '🏬',
    Restaurante: '🍽️',
    Hospedagem: '🏨',
    Museu: '🏛️',
    Transporte: '🚌',
    Saúde: '🏥',
    Educação: '🎓',
    Lazer: '🎡',
    street: '🛣️',
    Rua: '🛣️',
    Dispositivo: '📡',
    outros: '📍',
  };

  const icon = categoryIcons[result.category || categoryLabel || result.type || 'outros'] || '📍';

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
        <p className="text-sm text-gray-600 capitalize mb-3">{categoryLabel}</p>
        {!result.category && result.subtitle && (
          <p className="text-sm text-gray-600 mb-3">{result.subtitle}</p>
        )}

        {/* Mock metrics with stable seed per result */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < starsFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">{rating} ({reviews} avaliações)</span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{status}</span>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{price}</span>
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

        {/* Route button */}
        <button
          onClick={() => openRoutePanel(
            { lat: result.lat, lng: result.lng },
            result.name,
          )}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Route size={18} />
          Traçar rota
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
