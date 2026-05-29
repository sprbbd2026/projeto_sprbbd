import { useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';

export function MapEvents() {
  const { setSelectedCoord } = useMapStore();

  useMapEvents({
    click(e) {
      setSelectedCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}
