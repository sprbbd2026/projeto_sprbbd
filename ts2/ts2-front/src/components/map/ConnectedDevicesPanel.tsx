import { ChevronDown, ChevronUp, Radio, Wifi } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR');
}

/**
 * Overlay flutuante com os dispositivos online e o horário da última
 * atualização. Os dados são atualizados automaticamente pelo polling do
 * dashboard (US304).
 */
interface ConnectedDevicesPanelProps {
  collapsed: boolean
  onToggle: () => void
}

export function ConnectedDevicesPanel({ collapsed, onToggle }: ConnectedDevicesPanelProps) {
  const { connectedDevices, lastUpdated } = useMapStore();

  return (
    <div className="absolute top-4 right-4 z-1000 max-w-[85vw]">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/95 shadow-2xl backdrop-blur transition-all duration-300">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-2">
            <Wifi size={18} className="text-green-600" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-800">Dispositivos conectados</h3>
              <p className="text-[11px] text-gray-400">
                {lastUpdated
                  ? `Atualizado às ${formatTime(lastUpdated)}`
                  : 'Aguardando primeira atualização…'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
              {connectedDevices.length}
            </span>
            {collapsed ? (
              <ChevronDown size={18} className="text-gray-400" />
            ) : (
              <ChevronUp size={18} className="text-gray-400" />
            )}
          </div>
        </button>

        {!collapsed && (
          <>
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {connectedDevices.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-gray-400">
                  Nenhum dispositivo online no momento.
                </li>
              ) : (
                connectedDevices.map((device) => (
                  <li key={device.uuid} className="flex items-center gap-2 px-4 py-2">
                    <Radio size={14} className="shrink-0 text-green-500" />
                    <span className="truncate font-mono text-xs text-gray-700" title={device.uuid}>
                      {device.uuid}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
