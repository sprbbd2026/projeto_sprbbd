import { useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';

export function MapEvents() {
  const setSelectedCoord = useMapStore((state) => state.setSelectedCoord);
  const isAddModalOpen = useMapStore((state) => state.isAddModalOpen);
  const showCoverage = useMapStore((state) => state.showCoverage);
  const map = useMap();
  const [hasLocated, setHasLocated] = useState(false);

  useEffect(() => {
    if (!hasLocated) {
      map.locate();
    }
  }, [map, hasLocated]);

  useMapEvents({
    locationfound(e) {
      setHasLocated(true);
      map.flyTo(e.latlng, 14); // Zoom in on user
    },
    click(e) {
      if (isAddModalOpen || showCoverage) return;
      setSelectedCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}
