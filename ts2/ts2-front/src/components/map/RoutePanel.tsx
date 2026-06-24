import { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, ArrowRightLeft, Loader2, Route, LocateFixed } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { routingService } from '../../services/routingService';
import { ITA_DCTA_LABEL, ITA_DCTA_ORIGIN } from '../../utils/defaultOrigin';
import { requestCurrentPosition } from '../../utils/geolocation';

interface RouteDestination {
  lat: number;
  lng: number;
  label: string;
}

interface RouteSuggestion {
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  isMarker: boolean;
}

const DEFAULT_ORIGIN = { lat: ITA_DCTA_ORIGIN.lat, lng: ITA_DCTA_ORIGIN.lng };

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
  const locations = useMapStore((state) => state.locations);
  const connectedDevices = useMapStore((state) => state.connectedDevices);

  const [destination, setDestination] = useState<RouteDestination | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState<RouteSuggestion[]>([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [originInput, setOriginInput] = useState(ITA_DCTA_LABEL);
  const [originCoord, setOriginCoord] = useState<{ lat: number; lng: number }>(DEFAULT_ORIGIN);
  const [originSuggestions, setOriginSuggestions] = useState<RouteSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [gpsUnavailable, setGpsUnavailable] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCalcRef = useRef(false);

  const getMarkerMatches = (query: string): RouteSuggestion[] => {
    const q = query.toLowerCase();
    const matched: RouteSuggestion[] = [];

    for (const loc of locations) {
      if (loc.name.toLowerCase().includes(q)) {
        matched.push({ label: loc.name, sublabel: loc.category, lat: loc.lat, lng: loc.lng, isMarker: true });
      }
    }
    for (const dev of connectedDevices) {
      if (dev.lat != null && dev.lng != null && dev.uuid.toLowerCase().includes(q)) {
        matched.push({ label: `Dispositivo ${dev.uuid.substring(0, 8)}...`, lat: dev.lat, lng: dev.lng, isMarker: true });
      }
    }
    return matched;
  };

  const applyDefaultOrigin = () => {
    setOriginCoord(DEFAULT_ORIGIN);
    setOriginInput(ITA_DCTA_LABEL);
    setIsUsingCurrentLocation(false);
  };

  useEffect(() => {
    const handleOpenPanel = (event: Event) => {
      const customEvent = event as CustomEvent<{ destination: { lat: number; lng: number }; destinationLabel: string }>;
      setDestination({
        lat: customEvent.detail.destination.lat,
        lng: customEvent.detail.destination.lng,
        label: customEvent.detail.destinationLabel,
      });
      setDestinationInput(customEvent.detail.destinationLabel);
      autoCalcRef.current = false;
    };

    window.addEventListener('route:open-panel', handleOpenPanel);
    return () => window.removeEventListener('route:open-panel', handleOpenPanel);
  }, []);

  useEffect(() => {
    if (!isRoutePanelOpen) return;
    applyDefaultOrigin();
    setGpsUnavailable(false);
    autoCalcRef.current = false;
  }, [isRoutePanelOpen]);

  useEffect(() => {
    if (!isRoutePanelOpen || !originCoord || !destination || autoCalcRef.current) return;
    autoCalcRef.current = true;
    calculateRoute(originCoord, destination, originInput, destination.label);
  }, [isRoutePanelOpen, originCoord, destination, originInput, calculateRoute]);

  useEffect(() => {
    if (isUsingCurrentLocation || originInput.length < 3) {
      setOriginSuggestions([]);
      return;
    }

    const markerMatches = getMarkerMatches(originInput);
    setOriginSuggestions(markerMatches);
    if (markerMatches.length > 0) setShowOriginSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await routingService.geocode(originInput, {
          lat: originCoord?.lat,
          lng: originCoord?.lng,
          maxDistanceKm: 500,
        });
        const geocodeSuggestions: RouteSuggestion[] = results.slice(0, 5).map((r) => ({
          label: r.display_name.split(',')[0],
          sublabel: r.display_name.split(',').slice(1, 3).join(',').trim(),
          lat: r.lat,
          lng: r.lng,
          isMarker: false,
        }));
        setOriginSuggestions([...markerMatches, ...geocodeSuggestions]);
        setShowOriginSuggestions(true);
      } catch {
        setOriginSuggestions(markerMatches);
      }
    }, 350);
  }, [originInput, isUsingCurrentLocation]);

  useEffect(() => {
    if (!destinationInput || destinationInput.length < 3 || (destination && destinationInput === destination.label)) {
      setDestinationSuggestions([]);
      return;
    }

    const markerMatches = getMarkerMatches(destinationInput);
    setDestinationSuggestions(markerMatches);
    if (markerMatches.length > 0) setShowDestinationSuggestions(true);

    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);

    destDebounceRef.current = setTimeout(async () => {
      try {
        const results = await routingService.geocode(destinationInput, {
          lat: originCoord?.lat,
          lng: originCoord?.lng,
          maxDistanceKm: 500,
        });
        const geocodeSuggestions: RouteSuggestion[] = results.slice(0, 5).map((r) => ({
          label: r.display_name.split(',')[0],
          sublabel: r.display_name.split(',').slice(1, 3).join(',').trim(),
          lat: r.lat,
          lng: r.lng,
          isMarker: false,
        }));
        setDestinationSuggestions([...markerMatches, ...geocodeSuggestions]);
        setShowDestinationSuggestions(true);
      } catch {
        setDestinationSuggestions(markerMatches);
      }
    }, 350);
  }, [destinationInput]);

  const handleSelectDestination = (suggestion: RouteSuggestion) => {
    const dest = { lat: suggestion.lat, lng: suggestion.lng, label: suggestion.label };
    setDestination(dest);
    setDestinationInput(suggestion.label);
    setShowDestinationSuggestions(false);
    calculateRoute(originCoord, dest, originInput, suggestion.label);
  };

  const handleSelectOrigin = (suggestion: RouteSuggestion) => {
    setOriginCoord({ lat: suggestion.lat, lng: suggestion.lng });
    setOriginInput(suggestion.label);
    setShowOriginSuggestions(false);
    setIsUsingCurrentLocation(false);
    setGpsUnavailable(false);

    if (destination) {
      calculateRoute(
        { lat: suggestion.lat, lng: suggestion.lng },
        destination,
        suggestion.label,
        destination.label,
      );
    }
  };

  const handleUseCurrentLocation = async () => {
    setGpsUnavailable(false);
    const coord = await requestCurrentPosition();

    if (coord) {
      setOriginCoord(coord);
      setOriginInput('Minha localização');
      setIsUsingCurrentLocation(true);
      setShowOriginSuggestions(false);
      if (destination) {
        calculateRoute(coord, destination, 'Minha localização', destination.label);
      }
      return;
    }

    setGpsUnavailable(true);
    applyDefaultOrigin();
    if (destination) {
      calculateRoute(DEFAULT_ORIGIN, destination, ITA_DCTA_LABEL, destination.label);
    }
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
    setGpsUnavailable(false);

    calculateRoute(newOrigin, newDest, newOriginLabel, newDest.label);
  };

  const handleClose = () => {
    closeRoutePanel();
    clearRoute();
    setDestination(null);
    setDestinationInput('');
    applyDefaultOrigin();
    setGpsUnavailable(false);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    autoCalcRef.current = false;
  };

  if (!isRoutePanelOpen) return null;

  return (
    <div className="absolute left-4 top-20 md:left-20 md:top-24 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 pointer-events-auto overflow-hidden">
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

      <div className="p-4 space-y-3">
        <div className="relative">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
            <Navigation size={16} className="text-blue-500 shrink-0" />
            <input
              type="text"
              value={originInput}
              onChange={(e) => {
                setOriginInput(e.target.value);
                setIsUsingCurrentLocation(false);
                setGpsUnavailable(false);
              }}
              onFocus={() => {
                if (!isUsingCurrentLocation && originSuggestions.length > 0) {
                  setShowOriginSuggestions(true);
                }
              }}
              placeholder="Origem"
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            />
            <button
              onClick={() => void handleUseCurrentLocation()}
              className="text-blue-500 hover:text-blue-700 shrink-0 p-1 rounded hover:bg-blue-50 transition-colors"
              title="Usar minha localização"
            >
              <LocateFixed size={16} />
            </button>
          </div>

          {!isUsingCurrentLocation && (
            <p className="mt-1 text-[11px] text-gray-500">
              Origem padrão: campus do ITA no DCTA. Use o ícone de GPS para tentar sua localização.
            </p>
          )}

          {gpsUnavailable && (
            <p className="mt-1 text-[11px] text-amber-700">
              Não foi possível obter o GPS. Usando o ITA como origem.
            </p>
          )}

          {showOriginSuggestions && originSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {originSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOrigin(s)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-2"
                >
                  {s.isMarker ? (
                    <MapPin size={14} className="text-red-500 shrink-0" />
                  ) : (
                    <Navigation size={14} className="text-gray-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{s.label}</p>
                    {s.sublabel && <p className="text-xs text-gray-400 truncate">{s.sublabel}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSwapLocations}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Inverter origem e destino"
          >
            <ArrowRightLeft size={16} />
          </button>
        </div>

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

          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {destinationSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectDestination(s)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-2"
                >
                  {s.isMarker ? (
                    <MapPin size={14} className="text-red-500 shrink-0" />
                  ) : (
                    <Navigation size={14} className="text-gray-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{s.label}</p>
                    {s.sublabel && <p className="text-xs text-gray-400 truncate">{s.sublabel}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

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
