import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Satellite, Map } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Mapa', icon: Map },
    { to: '/satellites', label: 'Satélites', icon: Satellite },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 gap-1 shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
              location.pathname === to
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
