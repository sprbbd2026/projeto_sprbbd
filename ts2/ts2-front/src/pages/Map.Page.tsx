import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { MapPin } from 'lucide-react';

import { MapLayout } from '../components/layout/MapLayout';
import { useMapStore } from '../store/mapStore';
import { CustomMapControls } from '../components/map/CustomMapControls';
import { MapEvents } from '../components/map/MapEvents';
import { SelectedPointCard } from '../components/map/SelectedPointCard';
import { AddLocationModal } from '../components/map/AddLocationModal';
import { MapMarkers } from '../components/map/MapMarkers';
import { ConnectedDevicesPanel } from '../components/map/ConnectedDevicesPanel';
import { DashboardSummaryPanel } from '../components/map/DashboardSummaryPanel';
import { RoutePanel } from '../components/map/RoutePanel';
import { RoutePolyline } from '../components/map/RoutePolyline';
import { usePolling } from '../hooks/usePolling';
import { MAP_DEFAULT_CENTER } from '../utils/defaultOrigin';

const droppedPinIcon = L.divIcon({
  html: renderToString(
    <div className="text-gray-800 drop-shadow-md animate-bounce">
      <MapPin size={36} fill="#FCA5A5" />
    </div>
  ),
  className: 'dropped-pin-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const currentLocationIcon = L.divIcon({
  html: renderToString(
    <div className="text-blue-600 drop-shadow-md animate-pulse">
      <MapPin size={34} fill="#93C5FD" />
    </div>
  ),
  className: 'current-location-icon',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function TemporaryLocationPin() {
  const map = useMap();
  const temporaryLocation = useMapStore((state) => state.temporaryLocation);

  useEffect(() => {
    if (!temporaryLocation) return;
    map.flyTo([temporaryLocation.lat, temporaryLocation.lng], 15, {
      animate: true,
    });
  }, [map, temporaryLocation]);

  if (!temporaryLocation) return null;

  return <Marker position={[temporaryLocation.lat, temporaryLocation.lng]} icon={currentLocationIcon} />;
}

export function MapPage() {
  const initialPosition: [number, number] = MAP_DEFAULT_CENTER;
  const { activeLayer, selectedCoord, fetchLocations, fetchConnectedDevices } = useMapStore();
  const [isDevicesPanelCollapsed, setIsDevicesPanelCollapsed] = useState(false);

  const refreshConnectedDevices = useCallback(() => {
    void fetchConnectedDevices();
  }, [fetchConnectedDevices]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  usePolling(refreshConnectedDevices, 15_000);

  const getTileUrl = () => {
    switch (activeLayer) {
      case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain': return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'carto': return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      case 'streets':
      default: return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getAttribution = () => {
    switch (activeLayer) {
      case 'satellite': return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'terrain': return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
      case 'carto': return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
      case 'streets':
      default: return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  return (
    <MapLayout>
      <MapContainer
        center={initialPosition}
        zoom={10}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <MapEvents />
        <CustomMapControls />
        <TileLayer key={activeLayer} attribution={getAttribution()} url={getTileUrl()} />

        <MapMarkers />
        <TemporaryLocationPin />
        <RoutePolyline />

        {selectedCoord && (
          <Marker position={[selectedCoord.lat, selectedCoord.lng]} icon={droppedPinIcon} />
        )}
      </MapContainer>

      {/* Floating Overlays */}
      <DashboardSummaryPanel />
      <ConnectedDevicesPanel
        collapsed={isDevicesPanelCollapsed}
        onToggle={() => setIsDevicesPanelCollapsed((current) => !current)}
      />
      <SelectedPointCard />
      <AddLocationModal />
      <RoutePanel />
    </MapLayout>
  );
}