import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';

export function MapEvents() {
  const setSelectedCoord = useMapStore((state) => state.setSelectedCoord);
  const setTemporaryLocation = useMapStore((state) => state.setTemporaryLocation);
  const isAddModalOpen = useMapStore((state) => state.isAddModalOpen);
  const map = useMap();

  useEffect(() => {
    const handleLocateCurrent = () => {
      const currentTemporaryLocation = useMapStore.getState().temporaryLocation;

      if (currentTemporaryLocation) {
        setTemporaryLocation(null);
        return;
      }

      map.locate({
        enableHighAccuracy: true,
        setView: false,
        maxZoom: 15,
      });
    };

    window.addEventListener('map:locate-current', handleLocateCurrent);

    return () => {
      window.removeEventListener('map:locate-current', handleLocateCurrent);
    };
  }, [map, setTemporaryLocation]);

  useMapEvents({
    locationfound(e) {
      setTemporaryLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, 15, { animate: true });
    },
    click(e) {
      if (isAddModalOpen) return;
      setSelectedCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}
