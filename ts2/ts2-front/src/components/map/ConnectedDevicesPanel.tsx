import { Radio, Wifi } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR');
}

/**
 * Overlay flutuante com os dispositivos online e o horário da última
 * atualização. Os dados são atualizados automaticamente pelo polling do
 * dashboard (US304).
 */
export function ConnectedDevicesPanel() {
  const { connectedDevices, lastUpdated } = useMapStore();

  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 max-w-[85vw]">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wifi size={18} className="text-green-600" />
            <h3 className="font-bold text-gray-800 text-sm">Dispositivos conectados</h3>
          </div>
          <span className="text-xs font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
            {connectedDevices.length}
          </span>
        </div>

        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
          {connectedDevices.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-gray-400">
              Nenhum dispositivo online no momento.
            </li>
          ) : (
            connectedDevices.map((device) => (
              <li key={device.uuid} className="flex items-center gap-2 px-4 py-2">
                <Radio size={14} className="text-green-500 shrink-0" />
                <span className="font-mono text-xs text-gray-700 truncate" title={device.uuid}>
                  {device.uuid}
                </span>
              </li>
            ))
          )}
        </ul>

        <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400">
          {lastUpdated
            ? `Última atualização: ${formatTime(lastUpdated)}`
            : 'Aguardando primeira atualização…'}
        </div>
      </div>
    </div>
  );
}
