import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Radio, LayoutGrid, ShieldAlert } from 'lucide-react';
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

// Helper matemático para calcular a área de cobertura aproximada em km² (Shoelace formula adaptada)
function calculateCoverageArea(points: { lat: number; lng: number }[]): number {
  if (points.length < 3) return 0;

  // 1. Encontrar o centro geométrico (baricentro) para ordenar os pontos radialmente
  const cx = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.lat, 0) / points.length;

  // 2. Ordenar anti-horário para evitar que o polígono se cruze
  const sortedPoints = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.lat - cy, a.lng - cx);
    const angleB = Math.atan2(b.lat - cy, b.lng - cx);
    return angleA - angleB;
  });

  // 3. Algoritmo Shoelace
  let area = 0;
  const j = sortedPoints.length - 1;

  for (let i = 0; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i === 0 ? j : i - 1];
    const curr = sortedPoints[i];
    area += (prev.lng + curr.lng) * (prev.lat - curr.lat);
  }

  // Conversão aproximada de graus quadrados para km² na latitude do Vale do Paraíba (1° lat ≈ 111km, 1° lng ≈ 102km)
  const areaInSquareDegrees = Math.abs(area / 2);
  const conversionFactor = 111 * 102; 

  return areaInSquareDegrees * conversionFactor;
}

export function PointsSatellites() {
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

  // CORREÇÃO: Trocado de locations.length para satellites.length
  if (!satellites || satellites.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análise de Satélites</h1>
            <p className="text-gray-500 text-sm mt-1">Análise de área de cobertura</p>
          </div>

          <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl p-12 shadow-sm min-h-[450px] text-center mt-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 opacity-30 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Radio size={40} className="animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum Satélite Cadastrado</h3>
            <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
              Não encontramos satélites operacionais ou pontos na sua base de dados atual.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalPoints = satellites.length;
  const coverageArea = calculateCoverageArea(satellites);

  // Grouped city data for Pie Chart
  const cityPieData = CITIES.map((city, idx) => {
    const count = satellites.filter(l => getNearestCity(l.lat, l.lng) === city.name).length;
    const colors = ['#0A31A6', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return {
      name: city.name,
      value: count,
      color: colors[idx % colors.length]
    };
  }).filter(item => item.value > 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análise de Satélites</h1>
            <p className="text-gray-500 text-sm mt-1">Mapeamento de área e monitoramento regional</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Radio size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Satélites</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalPoints}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <LayoutGrid size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Área Estimada de Cobertura</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {coverageArea > 0 ? `${coverageArea.toFixed(2)} km²` : 'Mín. 3 pontos necessários'}
              </h3>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Tabela dos Satélites (Ocupa 2 colunas no desktop) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Listagem de Dispositivos</h3>
              <p className="text-sm text-gray-500">Detalhamento dos pontos de transmissão ativos</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="p-4 font-semibold text-gray-600 text-sm">ID / Nome</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Cidade Próxima</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Coordenadas (Lat, Lng)</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {satellites.map((sat) => (
                    <tr key={sat.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-800 text-sm">{sat.name || `Satélite ${sat.id}`}</td>
                      <td className="p-4 text-gray-600 text-sm">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium text-gray-700">
                          <MapPin size={12} className="text-gray-400" />
                          {getNearestCity(sat.lat, sat.lng)}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-500">
                        {sat.lat.toFixed(4)}, {sat.lng.toFixed(4)}
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{sat.operational ? "Sim" : "Não"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico de Pizza Lateral (Ocupa 1 coluna) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800">Distribuição por Região</h3>
              <p className="text-sm text-gray-500">Porcentagem de satélites vinculados a cada cidade</p>
            </div>
            <div className="w-full min-h-[300px] flex-1">
              {cityPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cityPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={95}
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
                      align="center"
                      iconType="circle"
                      layout="horizontal"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <ShieldAlert size={24} />
                  <span className="text-sm">Sem dados suficientes para gerar o gráfico.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}