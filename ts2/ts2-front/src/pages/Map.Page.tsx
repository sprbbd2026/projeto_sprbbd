import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function MapPage() {
  const initialPosition: [number, number] = [-23.2081, -45.8828];

  return (
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Monitoramento Ground - RPS</h1>
        <p style={{ color: '#666' }}>Visualização regional das estações base.</p>
      </header>

      {/* O MapContainer precisa de uma altura definida (height) para aparecer */}
      <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
        <MapContainer 
          center={initialPosition} 
          zoom={10} 
          style={{ height: '100%', width: '100%' }}
        >
          {/* TileLayer é o provedor das imagens do mapa (OpenStreetMap) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Exemplo de um marcador estático representando uma estação base */}
          <Marker position={initialPosition}>
            <Popup>
              <strong>Estação Base Alpha</strong> <br />
              Status: Ativa
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}