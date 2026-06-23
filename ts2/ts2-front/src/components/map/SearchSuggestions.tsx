import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { routingService, type GeocodeResult } from '../../services/routingService';

interface SearchResult {
  type: 'location' | 'device' | 'street' | 'poi';
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
  const [nonMarkerResults, setNonMarkerResults] = useState<SearchResult[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inferNonMarkerCategory = (result: GeocodeResult): { type: 'street' | 'poi'; label: string } => {
    const typeText = (result.type || '').toLowerCase();
    const amenityText = (result.address?.amenity || '').toLowerCase();
    const tourismText = (result.address?.tourism || '').toLowerCase();
    const shopText = (result.address?.shop || '').toLowerCase();
    const transportText = (result.address?.public_transport || '').toLowerCase();
    const buildingText = (result.address?.building || '').toLowerCase();
    const manMadeText = (result.address?.man_made || '').toLowerCase();
    const joined = `${typeText} ${amenityText} ${tourismText} ${shopText} ${transportText} ${buildingText} ${manMadeText}`;

    // Saúde
    if (joined.includes('hospital') || joined.includes('clinic') || joined.includes('pharmacy') || joined.includes('health') || joined.includes('medical')) {
      return { type: 'poi', label: 'Saúde' };
    }

    // Shopping
    if (joined.includes('mall') || joined.includes('shopping') || joined.includes('center') || (joined.includes('retail') && !joined.includes('supermarket'))) {
      return { type: 'poi', label: 'Shopping' };
    }

    // Mercado
    if (
      joined.includes('supermarket') || joined.includes('grocery') || joined.includes('market') ||
      joined.includes('department_store')
    ) {
      return { type: 'poi', label: 'Mercado' };
    }

    // Restaurante
    if (joined.includes('restaurant') || joined.includes('food') || joined.includes('cafe') || joined.includes('bar') || joined.includes('pub')) {
      return { type: 'poi', label: 'Restaurante' };
    }

    // Hospedagem
    if (joined.includes('hotel') || joined.includes('hostel') || joined.includes('guest_house') || joined.includes('motel') || joined.includes('accommodation')) {
      return { type: 'poi', label: 'Hospedagem' };
    }

    // Museu
    if (joined.includes('museum') || joined.includes('gallery') || joined.includes('art') || joined.includes('exhibition')) {
      return { type: 'poi', label: 'Museu' };
    }

    // Transporte
    if (
      joined.includes('bus') || joined.includes('station') || joined.includes('transport') ||
      joined.includes('railway') || joined.includes('airport') || joined.includes('terminal') ||
      joined.includes('parking')
    ) {
      return { type: 'poi', label: 'Transporte' };
    }

    // Educação
    if (joined.includes('school') || joined.includes('university') || joined.includes('college') || joined.includes('education')) {
      return { type: 'poi', label: 'Educação' };
    }

    // Lazer
    if (joined.includes('park') || joined.includes('cinema') || joined.includes('theatre') || joined.includes('sports') || joined.includes('gym')) {
      return { type: 'poi', label: 'Lazer' };
    }

    // Rua (somente se for claramente apenas uma rua)
    const road = result.address?.road;
    const avenue = result.address?.avenue;
    const pedestrian = result.address?.pedestrian;
    const hasStreetAddress = Boolean(road || avenue || pedestrian);

    if (hasStreetAddress && !amenityText && !shopText && !tourismText) {
      return { type: 'street', label: 'Rua' };
    }

    return { type: 'poi', label: 'Local' };
  };

  const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

    return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
  };

  const sortByDistance = (results: SearchResult[]) => {
    if (!userLocation) return results;
    return [...results].sort((first, second) => {
      const firstDistance = distanceKm(userLocation, { lat: first.lat, lng: first.lng });
      const secondDistance = distanceKm(userLocation, { lat: second.lat, lng: second.lng });
      return firstDistance - secondDistance;
    });
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // Fallback: usar centro de São José dos Campos como padrão
        setUserLocation({ lat: -23.1813, lng: -45.8879 });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      },
    );
  };

  useEffect(() => {
    requestGeolocation();
  }, []);

  useEffect(() => {
    if (!isOpen || query.trim().length < 3) {
      setNonMarkerResults([]);
      return;
    }

    // Tentar obter geolocalização novamente quando busca começa
    if (!userLocation) {
      requestGeolocation();
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const referenceLocation = userLocation || { lat: -23.1813, lng: -45.8879 };
        const maxDistanceKm = 500;
        const queryLower = query.toLowerCase();

        // Map keywords to categories
        const categoryKeywords: Record<string, string[]> = {
          restaurantes: ['restaurante', 'pizza', 'comida', 'café', 'bar', 'lanchonete'],
          hoteis: ['hotel', 'hospedagem', 'pousada', 'motel'],
          museus: ['museu', 'galeria', 'arte', 'exposição'],
          transporte: ['transporte', 'ônibus', 'metrô', 'táxi', 'terminal'],
          shopping: ['shopping', 'shopping center', 'mall', 'centro comercial', 'varejo'],
          mercado: ['supermercado', 'mercado', 'grocery', 'padaria', 'açougue', 'frutas'],
          saude: ['saúde', 'hospital', 'clínica', 'farmácia', 'médico'],
          educacao: ['educação', 'escola', 'universidade', 'faculdade'],
          lazer: ['lazer', 'parque', 'cinema', 'teatro', 'piscina'],
        };

        // Check if query matches a category - if yes, search for category keywords
        let searchQuery = query;
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          const matchesKeyword = keywords.some((keyword) => queryLower.includes(keyword) || keyword.includes(queryLower));
          if (matchesKeyword) {
            // Use first keyword for category search
            searchQuery = keywords[0];
            break;
          }
        }

        // Chamar API (Nominatim com filtro Haversine no backend)
        const geocodeResults = await routingService.geocode(searchQuery, {
          lat: referenceLocation.lat,
          lng: referenceLocation.lng,
          maxDistanceKm,
        });

        // Apenas filtrar administrativos (distância já foi filtrada no backend)
        const filtered = geocodeResults
          .filter((result) => result.type !== 'administrative')
          .slice(0, 15);

        const results: SearchResult[] = filtered.map((result, index) => {
          const inferred = inferNonMarkerCategory(result);
          return {
            type: inferred.type,
            id: `geocode-${index}-${result.lat}-${result.lng}`,
            name:
              result.address?.road ||
              result.address?.avenue ||
              result.address?.pedestrian ||
              result.display_name.split(',')[0],
            lat: result.lat,
            lng: result.lng,
            category: inferred.label,
            subtitle: result.display_name,
          };
        });
        setNonMarkerResults(sortByDistance(results));
      } catch {
        setNonMarkerResults([]);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, query, userLocation]);

  if (!isOpen || !query.trim()) {
    return null;
  }

  const queryLower = query.toLowerCase();

  // Filter locations (prioritized)
  const matchedLocations: SearchResult[] = sortByDistance(
    locations
      .filter((loc) => loc.name.toLowerCase().includes(queryLower))
      .map((loc) => ({
        type: 'location' as const,
        id: loc.id,
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        category: loc.category,
      })),
  );

  // Filter connected devices (addresses) - only if they have coordinates
  const matchedDevices: SearchResult[] = sortByDistance(
    connectedDevices
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
      })),
  );

  // Combine results: locations + geocode results
  const combinedLocationResults = matchedLocations;

  const sortedNonMarkerResults = sortByDistance(nonMarkerResults);
  const streetResults = sortedNonMarkerResults.filter((result) => result.type === 'street');
  const poiResults = sortedNonMarkerResults.filter((result) => result.type === 'poi');
  const hasNonMarkerResults = nonMarkerResults.length > 0;
  const hasMarkerResults = combinedLocationResults.length > 0;
  const allResults = [...combinedLocationResults, ...nonMarkerResults, ...matchedDevices];

  if (allResults.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-12 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-1000 max-h-96 overflow-y-auto pointer-events-auto">
      {combinedLocationResults.length > 0 && (
        <div>
          <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
            Locais
          </div>
          {combinedLocationResults.map((result) => (
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

      {hasNonMarkerResults && (
        <div>
          {hasMarkerResults && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
              Ruas e Lugares
            </div>
          )}
          {!hasMarkerResults && (
            <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
              Resultados
            </div>
          )}
          {streetResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => onSelectLocation(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-900">{result.name}</div>
              <div className="text-xs text-gray-500">{result.category}</div>
              {result.subtitle && (
                <div className="text-xs text-gray-500">{result.subtitle}</div>
              )}
            </button>
          ))}
          {poiResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => onSelectLocation(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-900">{result.name}</div>
              <div className="text-xs text-gray-500">{result.category}</div>
              {result.subtitle && (
                <div className="text-xs text-gray-500">{result.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {matchedDevices.length > 0 && (
        <div>
          {(combinedLocationResults.length > 0 || hasNonMarkerResults) && (
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
