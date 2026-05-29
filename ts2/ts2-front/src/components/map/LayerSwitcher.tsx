import { useMapStore, type MapLayer } from '../../store/mapStore';

const LAYERS: { id: MapLayer; label: string }[] = [
  { id: 'streets', label: 'Ruas' },
  { id: 'satellite', label: 'Satélite' },
  { id: 'terrain', label: 'Terreno' },
  { id: 'carto', label: 'Carto' },
];

export function LayerSwitcher() {
  const { activeLayer, setActiveLayer } = useMapStore();

  return (
    <div className="absolute bottom-8 right-4 z-[1000] bg-white rounded-2xl shadow-lg p-3 flex flex-col gap-1">
      {LAYERS.map((layer) => (
        <button
          key={layer.id}
          onClick={() => setActiveLayer(layer.id)}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${
            activeLayer === layer.id
              ? 'bg-blue-600 text-white font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}
