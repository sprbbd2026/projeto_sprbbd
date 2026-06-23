import { useEffect } from 'react';
import { CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';

export function RoutePolyline() {
  const activeRoute = useMapStore((state) => state.activeRoute);
  const map = useMap();

  useEffect(() => {
    if (!activeRoute || activeRoute.geometry.length === 0) return;

    // Fit map bounds to show the full route
    const latlngs = activeRoute.geometry.map(([lat, lng]) => [lat, lng] as [number, number]);
    const bounds = latlngs.reduce(
      (acc, [lat, lng]) => ({
        minLat: Math.min(acc.minLat, lat),
        maxLat: Math.max(acc.maxLat, lat),
        minLng: Math.min(acc.minLng, lng),
        maxLng: Math.max(acc.maxLng, lng),
      }),
      { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
    );

    map.fitBounds(
      [
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng],
      ],
      { padding: [50, 50], animate: true }
    );
  }, [activeRoute, map]);

  if (!activeRoute || activeRoute.geometry.length === 0) return null;

  return (
    <>
      {/* Route line */}
      <Polyline
        positions={activeRoute.geometry}
        pathOptions={{
          color: '#2563eb',
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Origin marker */}
      <CircleMarker
        center={[activeRoute.origin.lat, activeRoute.origin.lng]}
        radius={8}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
        }}
      >
        <Tooltip direction="top" offset={[0, -10]}>
          {activeRoute.originLabel}
        </Tooltip>
      </CircleMarker>

      {/* Destination marker */}
      <CircleMarker
        center={[activeRoute.destination.lat, activeRoute.destination.lng]}
        radius={8}
        pathOptions={{
          fillColor: '#ef4444',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
        }}
      >
        <Tooltip direction="top" offset={[0, -10]}>
          {activeRoute.destinationLabel}
        </Tooltip>
      </CircleMarker>
    </>
  );
}
