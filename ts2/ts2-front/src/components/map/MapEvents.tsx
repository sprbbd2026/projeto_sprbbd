import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { ITA_DCTA_ORIGIN } from '../../utils/defaultOrigin';

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

    const handleNavigateTo = (event: Event) => {
      const customEvent = event as CustomEvent<{ lat: number; lng: number }>;
      const { lat, lng } = customEvent.detail;
      map.flyTo([lat, lng], 15, { animate: true });
    };

    window.addEventListener('map:locate-current', handleLocateCurrent);
    window.addEventListener('map:navigate-to', handleNavigateTo);

    return () => {
      window.removeEventListener('map:locate-current', handleLocateCurrent);
      window.removeEventListener('map:navigate-to', handleNavigateTo);
    };
  }, [map, setTemporaryLocation]);

  useMapEvents({
    locationfound(e) {
      setTemporaryLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, 15, { animate: true });
    },
    locationerror() {
      const fallback = { lat: ITA_DCTA_ORIGIN.lat, lng: ITA_DCTA_ORIGIN.lng };
      setTemporaryLocation(fallback);
      map.flyTo([fallback.lat, fallback.lng], 14, { animate: true });
    },
    click(e) {
      if (isAddModalOpen) return;
      setSelectedCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}
