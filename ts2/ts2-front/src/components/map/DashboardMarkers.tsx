import { useState, useMemo, useEffect } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Satellite } from 'lucide-react';
import { useMapStore} from '../../store/mapStore';

const getOperationalConfig = (operational: boolean) => {
  if (operational) {
    return { icon: Satellite, bg: 'bg-green-500' };
  } else { 
    return { icon: Satellite, bg: 'bg-rose-600' };
  }
};

const createCustomIcon = (operational: boolean) => {
  const { icon: Icon, bg } = getOperationalConfig(operational);
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

export function DashboardMarkers() {
  const { satellites } = useMapStore();
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


  return (
    <>
      {satellites.map((satellite) => (
        <Marker key={satellite.id} position={[satellite.lat, satellite.lng]} icon={createCustomIcon(satellite.operational)}>
          <Popup>
            <div className="text-sm min-w-[150px]">
              <strong className="block text-base mb-1">{satellite.name}</strong>
              <div className="flex items-center gap-1 mb-2">
                <span className="font-medium text-gray-700">{satellite.operational ? "Operacional" : "Não Operacional"}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
