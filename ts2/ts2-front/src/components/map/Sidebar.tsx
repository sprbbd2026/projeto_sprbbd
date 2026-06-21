import { useState } from 'react';
import { Menu, LogOut, BarChart2, Settings, Users, Map as MapIcon, ChevronLeft, Activity, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BrazilIcon } from '../icons/BrazilIcon';

interface SidebarProps {
  isFixed?: boolean;
}

export function Sidebar({ isFixed = false }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: MapIcon, label: 'Mapa Principal', path: '/' },
    { icon: Activity, label: 'Dashboard', path: '/dashboard' },
    { icon: Gauge, label: 'Telemetria', path: '/telemetry' },
    { icon: BarChart2, label: 'Análise de Pontos', path: '/dashboards/pontos' },
    { icon: Users, label: 'Análise de Usuários', path: '/dashboards/usuarios' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  // Se for fixo, é colapsável: sem sombra, começa pequeno (w-20) e expande no hover (group-hover)
  const containerClasses = isFixed
    ? 'w-20 hover:w-72 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col relative z-[50] transition-all duration-300 ease-in-out group overflow-hidden'
    : `absolute top-0 left-0 h-full bg-white shadow-2xl z-[1000] transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'
    }`;

  const textVisibilityClass = isFixed
    ? 'w-0 opacity-0 overflow-hidden group-hover:w-auto group-hover:opacity-100 group-hover:ml-3'
    : 'w-auto opacity-100 ml-3';

  return (
    <>
      {/* Botão de abrir Menu (flutuante) - Apenas se não for fixo */}
      {!isFixed && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-[1000] p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Menu"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      )}

      {/* Sidebar Overlay - Apenas se não for fixo */}
      {!isFixed && isOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-[990]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={containerClasses}>
        <div className={`flex items-center border-b border-gray-100 ${isFixed ? 'p-4 justify-start' : 'p-4 justify-between'}`}>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
              <BrazilIcon color="#0A31A6" className="w-7 h-7" />
            </div>
            <h2 className={`text-lg font-bold text-[#0A31A6] whitespace-nowrap transition-all duration-300 ${textVisibilityClass}`}>
              BDB-RPS
            </h2>
          </div>

          {/* Botão de fechar (apenas se não for fixo) */}
          {!isFixed && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 overflow-x-hidden">
          <ul className="space-y-2 px-3">
            {navItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    if (!isFixed) setIsOpen(false);
                  }}
                  className={`w-full flex items-center p-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer ${isFixed ? 'justify-start' : ''}`}
                >
                  <div className="w-8 flex justify-center shrink-0">
                    <item.icon size={20} />
                  </div>
                  <span className={`font-normal text-sm whitespace-nowrap transition-all duration-300 ${textVisibilityClass}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer ${isFixed ? 'justify-start' : ''}`}
          >
            <div className="w-8 flex justify-center shrink-0">
              <LogOut size={20} />
            </div>
            <span className={`font-normal text-sm whitespace-nowrap transition-all duration-300 ${textVisibilityClass}`}>
              Sair
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
