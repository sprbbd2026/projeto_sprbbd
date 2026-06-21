import { useState, useMemo, useEffect } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Utensils, Bed, Landmark, Star, MapPin, Bus, Camera, HelpCircle } from 'lucide-react';
import { useMapStore, type LocationCategory } from '../../store/mapStore';

const getCategoryConfig = (category: LocationCategory) => {
  switch (category) {
    case 'restaurantes': return { icon: Utensils, bg: 'bg-rose-500' };
    case 'hoteis': return { icon: Bed, bg: 'bg-blue-600' };
    case 'museus': return { icon: Landmark, bg: 'bg-emerald-500' };
    case 'transporte': return { icon: Bus, bg: 'bg-amber-500' };
    case 'coisas_fazer': return { icon: Camera, bg: 'bg-purple-500' };
    case 'outros': return { icon: HelpCircle, bg: 'bg-gray-500' };
    default: return { icon: MapPin, bg: 'bg-gray-500' };
  }
};

const createCustomIcon = (category: LocationCategory) => {
  const { icon: Icon, bg } = getCategoryConfig(category);
  const iconHtml = renderToString(
    <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
      <Icon size={16} className="text-white" />
    </div>
  );
  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export function MapMarkers() {
  const { locations, activeFilters } = useMapStore();
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);

  const map = useMapEvents({
    moveend: () => setBounds(map.getBounds()),
    zoomend: () => setBounds(map.getBounds()),
  });

  useEffect(() => {
    if (map) {
      setBounds(map.getBounds());
    }
  }, [map]);

  const visibleLocations = useMemo(() => {
    return locations.filter((loc) => {
      // 1. Filter by category
      if (activeFilters.length > 0 && !activeFilters.includes(loc.category)) {
        return false;
      }
      
      // 2. Lazy Loading (Filter by map bounds)
      if (bounds) {
        return bounds.contains(L.latLng(loc.lat, loc.lng));
      }
      
      return true;
    });
  }, [locations, activeFilters, bounds]);

  return (
    <>
      {visibleLocations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={createCustomIcon(loc.category)}>
          <Popup>
            <div className="text-sm min-w-[150px]">
              <strong className="block text-base mb-1">{loc.name}</strong>
              <div className="flex items-center gap-1 mb-2">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="font-medium text-gray-700">{loc.rating}.0</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {loc.category}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
