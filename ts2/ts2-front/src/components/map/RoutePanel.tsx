import { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, ArrowRightLeft, Loader2, Route, LocateFixed } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { routingService, type GeocodeResult } from '../../services/routingService';

interface RouteDestination {
  lat: number;
  lng: number;
  label: string;
}

export function RoutePanel() {
  const {
    isRoutePanelOpen,
    closeRoutePanel,
    calculateRoute,
    activeRoute,
    isRouteLoading,
    routeError,
    clearRoute,
  } = useMapStore();

  const [destination, setDestination] = useState<RouteDestination | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodeResult[]>([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [originInput, setOriginInput] = useState('Minha localização');
  const [originCoord, setOriginCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<GeocodeResult[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for route panel open events
  useEffect(() => {
    const handleOpenPanel = (event: Event) => {
      const customEvent = event as CustomEvent<{ destination: { lat: number; lng: number }; destinationLabel: string }>;
      setDestination({
        lat: customEvent.detail.destination.lat,
        lng: customEvent.detail.destination.lng,
        label: customEvent.detail.destinationLabel,
      });
      setDestinationInput(customEvent.detail.destinationLabel);
    };

    window.addEventListener('route:open-panel', handleOpenPanel);
    return () => window.removeEventListener('route:open-panel', handleOpenPanel);
  }, []);

  // Get current location on mount
  useEffect(() => {
    if (!isRoutePanelOpen) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOriginCoord({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // Fallback SJC
        setOriginCoord({ lat: -23.1813, lng: -45.8879 });
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, [isRoutePanelOpen]);

  // Auto-calculate when origin is set and panel opens
  useEffect(() => {
    if (isRoutePanelOpen && originCoord && destination && isUsingCurrentLocation && !activeRoute) {
      calculateRoute(originCoord, destination, originInput, destination.label);
    }
  }, [isRoutePanelOpen, originCoord, destination, isUsingCurrentLocation]);

  // Search origin suggestions
  useEffect(() => {
    if (isUsingCurrentLocation || originInput.length < 3) {
      setOriginSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await routingService.geocode(originInput, {
          lat: originCoord?.lat,
          lng: originCoord?.lng,
          maxDistanceKm: 500,
        });
        setOriginSuggestions(results.slice(0, 5));
        setShowOriginSuggestions(true);
      } catch {
        setOriginSuggestions([]);
      }
    }, 350);
  }, [originInput, isUsingCurrentLocation]);

  // Search destination suggestions
  useEffect(() => {
    if (!destinationInput || destinationInput.length < 3 || (destination && destinationInput === destination.label)) {
      setDestinationSuggestions([]);
      return;
    }

    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);

    destDebounceRef.current = setTimeout(async () => {
      try {
        const results = await routingService.geocode(destinationInput, {
          lat: originCoord?.lat,
          lng: originCoord?.lng,
          maxDistanceKm: 500,
        });
        setDestinationSuggestions(results.slice(0, 5));
        setShowDestinationSuggestions(true);
      } catch {
        setDestinationSuggestions([]);
      }
    }, 350);
  }, [destinationInput]);

  const handleSelectDestination = (result: GeocodeResult) => {
    const label = result.display_name.split(',')[0];
    setDestination({ lat: result.lat, lng: result.lng, label });
    setDestinationInput(label);
    setShowDestinationSuggestions(false);

    const origin = originCoord || { lat: -23.1813, lng: -45.8879 };
    calculateRoute(origin, { lat: result.lat, lng: result.lng }, originInput, label);
  };

  const handleSelectOrigin = (result: GeocodeResult) => {
    setOriginCoord({ lat: result.lat, lng: result.lng });
    setOriginInput(result.display_name.split(',')[0]);
    setShowOriginSuggestions(false);
    setIsUsingCurrentLocation(false);

    if (destination) {
      calculateRoute(
        { lat: result.lat, lng: result.lng },
        destination,
        result.display_name.split(',')[0],
        destination.label,
      );
    }
  };

  const handleUseCurrentLocation = () => {
    setOriginInput('Minha localização');
    setIsUsingCurrentLocation(true);
    setShowOriginSuggestions(false);

    // Re-busca GPS real e recalcula rota
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coord = { lat: position.coords.latitude, lng: position.coords.longitude };
        setOriginCoord(coord);
        if (destination) {
          calculateRoute(coord, destination, 'Minha localização', destination.label);
        }
      },
      () => {
        // Fallback SJC
        const fallback = { lat: -23.1813, lng: -45.8879 };
        setOriginCoord(fallback);
        if (destination) {
          calculateRoute(fallback, destination, 'Minha localização', destination.label);
        }
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  const handleSwapLocations = () => {
    if (!destination || !originCoord) return;
    const newDest = { lat: originCoord.lat, lng: originCoord.lng, label: originInput };
    const newOrigin = { lat: destination.lat, lng: destination.lng };
    const newOriginLabel = destination.label;

    setDestination(newDest);
    setDestinationInput(newDest.label);
    setOriginCoord(newOrigin);
    setOriginInput(newOriginLabel);
    setIsUsingCurrentLocation(false);

    calculateRoute(newOrigin, newDest, newOriginLabel, newDest.label);
  };

  const handleClose = () => {
    closeRoutePanel();
    clearRoute();
    setDestination(null);
    setDestinationInput('');
    setOriginInput('Minha localização');
    setIsUsingCurrentLocation(true);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
  };

  if (!isRoutePanelOpen) return null;

  return (
    <div className="absolute left-4 top-20 md:left-20 md:top-24 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 pointer-events-auto overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Route size={18} />
          <span className="font-semibold text-sm">Traçar rota</span>
        </div>
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Route inputs */}
      <div className="p-4 space-y-3">
        {/* Origin */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
            <Navigation size={16} className="text-blue-500 shrink-0" />
            <input
              type="text"
              value={originInput}
              onChange={(e) => {
                setOriginInput(e.target.value);
                setIsUsingCurrentLocation(false);
              }}
              onFocus={() => {
                if (!isUsingCurrentLocation && originSuggestions.length > 0) {
                  setShowOriginSuggestions(true);
                }
              }}
              placeholder="Origem"
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            />
            {!isUsingCurrentLocation && (
              <button
                onClick={handleUseCurrentLocation}
                className="text-blue-500 hover:text-blue-700 shrink-0 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Usar minha localização"
              >
                <LocateFixed size={16} />
              </button>
            )}
          </div>

          {/* Origin suggestions dropdown */}
          {showOriginSuggestions && originSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              {originSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOrigin(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  {s.display_name.split(',').slice(0, 2).join(',')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapLocations}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Inverter origem e destino"
          >
            <ArrowRightLeft size={16} />
          </button>
        </div>

        {/* Destination */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
            <MapPin size={16} className="text-red-500 shrink-0" />
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => {
                setDestinationInput(e.target.value);
                setDestination(null);
              }}
              onFocus={() => {
                if (destinationSuggestions.length > 0) {
                  setShowDestinationSuggestions(true);
                }
              }}
              placeholder="Destino"
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>

          {/* Destination suggestions dropdown */}
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              {destinationSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectDestination(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  {s.display_name.split(',').slice(0, 2).join(',')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Route info */}
        {isRouteLoading && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Calculando rota...
          </div>
        )}

        {routeError && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
            {routeError}
          </div>
        )}

        {activeRoute && (
          <div className="bg-blue-50 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {activeRoute.duration_min < 60
                  ? `${Math.round(activeRoute.duration_min)} min`
                  : `${Math.floor(activeRoute.duration_min / 60)}h ${Math.round(activeRoute.duration_min % 60)}min`}
              </span>
              <span className="text-sm text-gray-600">
                {activeRoute.distance_km < 1
                  ? `${Math.round(activeRoute.distance_km * 1000)} m`
                  : `${activeRoute.distance_km.toFixed(1)} km`}
              </span>
            </div>
            <p className="text-xs text-gray-500">via carro</p>
          </div>
        )}
      </div>
    </div>
  );
}
