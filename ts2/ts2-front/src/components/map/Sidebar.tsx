import { Link } from 'react-router-dom';
import { LayoutDashboard, Satellite, Map } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-2xl shadow-lg p-3 flex flex-col gap-2">
      <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm text-gray-700">
        <LayoutDashboard size={16} /> Dashboard
      </Link>
      <Link to="/satellites" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm text-gray-700">
        <Satellite size={16} /> Satélites
      </Link>
      <Link to="/map" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
        <Map size={16} /> Mapa
      </Link>
    </div>
  );
}
