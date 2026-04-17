import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MapPin, Star, Award, Plus, Download } from 'lucide-react';
import { useMapStore } from '../store/mapStore';

// Vale do Paraíba/Litoral Norte Cities and centroids
const CITIES = [
  { name: 'São José dos Campos', lat: -23.2081, lng: -45.8828 },
  { name: 'Taubaté', lat: -23.0264, lng: -45.5552 },
  { name: 'Jacareí', lat: -23.3052, lng: -45.9658 },
  { name: 'Ubatuba', lat: -23.4339, lng: -45.0711 },
  { name: 'Caraguatatuba', lat: -23.6226, lng: -45.4124 },
  { name: 'São Sebastião', lat: -23.7600, lng: -45.4000 },
];

// Helper to determine closest city based on coordinates
function getNearestCity(lat: number, lng: number): string {
  let minDistance = Infinity;
  let nearestCity = 'Outra';
  
  for (const city of CITIES) {
    const d = Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2);
    if (d < minDistance) {
      minDistance = d;
      nearestCity = city.name;
    }
  }
  
  return nearestCity;
}

export function PointsSattelites() {
  const { satellites, fetchSatellites, isLoading } = useMapStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSatellites();
  }, [fetchSatellites]);

  // Loading State
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Carregando dados do painel...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Empty State Fallback
  if (locations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Análise de Satélites</h1>
              <p className="text-gray-500 text-sm mt-1">Análise de área de cobertura</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl p-12 shadow-sm min-h-[450px] text-center mt-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 opacity-30 animate-ping duration-1000" />
              <div className="relative w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <MapPin size={40} className="animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum Satélite Cadastrado</h3>
            <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
              Não encontramos satélites operacionais
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Dynamic Statistics Calculations
  const totalPoints = satellites.length;

  // City distribution for Recharts Pie Chart (Grouped by closest city)
  const cityPieData = CITIES.map((city, idx) => {
    const count = satellites.filter(l => getNearestCity(l.lat, l.lng) === city.name).length;
    const colors = ['#0A31A6', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return {
      name: city.name,
      value: count,
      color: colors[idx % colors.length]
    };
  }).filter(item => item.value > 0); // Only show segments with data in Pie chart

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análise de Locais</h1>
            <p className="text-gray-500 text-sm mt-1">Análise dos Satélites Cadastrado</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Satélites</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalPoints}</h3>
            </div>
          </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
          {/* Bar Chart */}
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800">Distribuição por Cidades</h3>
              <p className="text-sm text-gray-500">Percentual de estabelecimentos em cada município da região</p>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
              {cityPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {cityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-sm text-gray-600 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Sem dados de locais suficientes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
