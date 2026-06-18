import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { MapPin, Satellite } from 'lucide-react';

import { MapDashboardLayout } from '../components/layout/MapDashboardLayout';
import { useMapStore } from '../store/mapStore';
import { CustomMapControls } from '../components/map/CustomMapControls';
import { MapEvents } from '../components/map/MapEvents';
import { SelectedPointCardDashboard } from '../components/map/SelectedPointCardDashboard';
import { DashboardMarkers } from '../components/map/DashboardMarkers';
import { MapViewController } from '../components/map/MapViewController';

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

const satelliteIcon = L.divIcon({
  html: renderToString(
    <div className="text-emerald-500 bg-emerald-50 border border-emerald-200 p-1.5 rounded-full shadow-md hover:scale-110 transition-transform">
      <Satellite size={16} />
    </div>
  ),
  className: 'satellite-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const getGeoJsonStyle = () => ({
  color: '#3B82F6',
  weight: 1.5,
  fillColor: '#3B82F6',
  fillOpacity: 0.12,
  dashArray: '3'
});

export function DashboardPage() {
  const initialPosition: [number, number] = [-23.2081, -45.8828];
  const { 
    activeLayer, 
    selectedCoord, 
    fetchSatellites,
    showCoverage,
    setShowCoverage,
    fetchCoverage,
    coverageData
  } = useMapStore();

  useEffect(() => {
    fetchSatellites();
  }, [fetchSatellites]);

  useEffect(() => {
    if (showCoverage && !coverageData) {
      fetchCoverage(1); // Carrega dados da constelação padrão ID 1
    }
  }, [showCoverage, coverageData, fetchCoverage]);

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

  const satellites = (showCoverage && coverageData?.features)
    ? coverageData.features
        .filter((f: any) => f.properties?.sat_id && f.properties?.posicao)
        .map((f: any) => ({
          id: f.properties.sat_id,
          lat: f.properties.posicao.lat,
          lng: f.properties.posicao.lng,
          altKm: f.properties.posicao.alt_km
        }))
    : [];

  return (
    <MapDashboardLayout>
      <div className="w-full h-full relative">
        <MapContainer 
          center={initialPosition} 
          zoom={4} // Zoom menor (ex: 4) ao ver a constelação inteira no Brasil
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={false}
        >
          <MapEvents />
          <MapViewController />
          <CustomMapControls />
          <TileLayer key={activeLayer} attribution={getAttribution()} url={getTileUrl()} />
          
          <DashboardMarkers />

          {selectedCoord && (
            <Marker position={[selectedCoord.lat, selectedCoord.lng]} icon={droppedPinIcon} />
          )}

          {/* Cobertura em GeoJSON no mapa 2D */}
          {showCoverage && coverageData && (
            <GeoJSON 
              key={JSON.stringify(coverageData)}
              data={coverageData}
              style={getGeoJsonStyle}
            />
          )}

          {/* Marcadores Verdes dos Satélites */}
          {showCoverage && satellites.map((sat: any) => (
            <Marker 
              key={`sat-${sat.id}`}
              position={[sat.lat, sat.lng]}
              icon={satelliteIcon}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <b className="text-emerald-600 block mb-1">Satélite {sat.id}</b>
                  <span>
                    Lat: {sat.lat.toFixed(4)}<br/>
                    Lng: {sat.lng.toFixed(4)}<br/>
                    Altitude: {sat.altKm.toFixed(1)} km
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Satellite Toggle Button (rendered outside MapContainer, always clickable) */}
        <div className="absolute right-4 z-[1000] flex flex-col gap-3" style={{ bottom: '176px' }}>
          <button 
            onClick={() => setShowCoverage(!showCoverage)}
            className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer ${
              showCoverage 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                : 'bg-white text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
            title="Visualizar Cobertura de Satélite"
          >
            <Satellite size={20} />
          </button>
        </div>

        {/* Floating Overlays */}
        <SelectedPointCardDashboard />
      </div>
    </MapDashboardLayout>
  );
}