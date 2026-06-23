import { useState, useMemo, useEffect } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Utensils, Bed, Landmark, MapPin, Bus, Camera, HelpCircle } from 'lucide-react';
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
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={createCustomIcon(loc.category)}
          eventHandlers={{
            click: () => {
              window.dispatchEvent(new CustomEvent('map:marker-clicked', {
                detail: {
                  type: 'location',
                  id: loc.id,
                  name: loc.name,
                  lat: loc.lat,
                  lng: loc.lng,
                  category: loc.category,
                },
              }));
            },
          }}
        />
      ))}
    </>
  );
}
