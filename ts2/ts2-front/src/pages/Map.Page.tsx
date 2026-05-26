import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

export function MapPage() {
  const initialPosition: [number, number] = [-23.2081, -45.8828];
  const { activeLayer, selectedCoord, fetchLocations } = useMapStore();

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

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

        {selectedCoord && (
          <Marker position={[selectedCoord.lat, selectedCoord.lng]} icon={droppedPinIcon} />
        )}
      </MapContainer>

      {/* Floating Overlays */}
      <SelectedPointCard />
      <AddLocationModal />
    </MapLayout>
  );
}