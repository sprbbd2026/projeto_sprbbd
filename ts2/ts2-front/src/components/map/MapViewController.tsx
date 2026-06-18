import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';

export function MapViewController() {
  const map = useMap();
  const showCoverage = useMapStore((state) => state.showCoverage);

  useEffect(() => {
    if (showCoverage) {
      // Centra no Brasil (lat: -14.235, lng: -51.925) e dá zoom out (zoom: 4)
      // para abranger a visualização completa da constelação e das órbitas
      map.flyTo([-14.235, -51.925], 4, {
        animate: true,
        duration: 1.2
      });
    }
  }, [showCoverage, map]);

  return null;
}
