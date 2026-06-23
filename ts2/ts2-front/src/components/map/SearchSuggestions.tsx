import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { routingService, type GeocodeResult } from '../../services/routingService';

interface SearchResult {
  type: 'location' | 'device' | 'street';
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
  subtitle?: string;
}

interface SearchSuggestionsProps {
  isOpen: boolean;
  query: string;
  onSelectLocation: (location: SearchResult) => void;
}

export function SearchSuggestions({ isOpen, query, onSelectLocation }: SearchSuggestionsProps) {
  const locations = useMapStore((state) => state.locations);
  const connectedDevices = useMapStore((state) => state.connectedDevices);
  const [streetResults, setStreetResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen || query.trim().length < 3) {
      setStreetResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const geocodeResults = await routingService.geocode(query);
        const streets: SearchResult[] = geocodeResults
          .filter((result: GeocodeResult) => {
            const road = result.address?.road;
            const avenue = result.address?.avenue;
            const pedestrian = result.address?.pedestrian;
            const hasStreetAddress = Boolean(road || avenue || pedestrian);
            return hasStreetAddress;
          })
          .slice(0, 6)
          .map((result, index) => ({
            type: 'street' as const,
            id: `street-${index}-${result.lat}-${result.lng}`,
            name: result.address?.road || result.address?.avenue || result.address?.pedestrian || result.display_name,
            lat: result.lat,
            lng: result.lng,
            subtitle: result.display_name,
          }));
        setStreetResults(streets);
      } catch {
        setStreetResults([]);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, query]);

  if (!isOpen || !query.trim()) {
    return null;
  }

  const queryLower = query.toLowerCase();

  // Filter locations (prioritized)
  const matchedLocations: SearchResult[] = locations
    .filter((loc) => loc.name.toLowerCase().includes(queryLower))
    .map((loc) => ({
      type: 'location' as const,
      id: loc.id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      category: loc.category,
    }));

  // Filter connected devices (addresses) - only if they have coordinates
  const matchedDevices: SearchResult[] = connectedDevices
    .filter(
      (dev) =>
        dev.lat !== null &&
        dev.lng !== null &&
        dev.uuid.toLowerCase().includes(queryLower),
    )
    .map((dev) => ({
      type: 'device' as const,
      id: dev.uuid,
      name: `Dispositivo ${dev.uuid.substring(0, 8)}...`,
      lat: dev.lat as number,
      lng: dev.lng as number,
    }));

  const allResults = [...matchedLocations, ...streetResults, ...matchedDevices];

  if (allResults.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-12 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-1000 max-h-96 overflow-y-auto pointer-events-auto">
      {matchedLocations.length > 0 && (
        <div>
          <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
            Locais
          </div>
          {matchedLocations.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => onSelectLocation(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-900">{result.name}</div>
              {result.category && (
                <div className="text-xs text-gray-500">{result.category}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {streetResults.length > 0 && (
        <div>
          {matchedLocations.length > 0 && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
              Ruas
            </div>
          )}
          {streetResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => onSelectLocation(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-900">{result.name}</div>
              {result.subtitle && (
                <div className="text-xs text-gray-500">{result.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {matchedDevices.length > 0 && (
        <div>
          {(matchedLocations.length > 0 || streetResults.length > 0) && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
              Endereços (Dispositivos)
            </div>
          )}
          {matchedDevices.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => onSelectLocation(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-900">{result.name}</div>
              <div className="text-xs text-gray-500">
                {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
