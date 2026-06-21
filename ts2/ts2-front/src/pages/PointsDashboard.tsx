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

export function PointsDashboard() {
  const { locations, fetchLocations, isLoading } = useMapStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

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

  // Export data to CSV (Excel compatible)
  const handleExportExcel = () => {
    const headers = ['ID', 'Nome', 'Categoria', 'Avaliação', 'Latitude', 'Longitude', 'Cidade mais próxima'];
    const rows = locations.map(l => [
      l.id,
      l.name,
      l.category,
      l.rating,
      l.lat,
      l.lng,
      getNearestCity(l.lat, l.lng)
    ]);
    
    // Add UTF-8 BOM so Excel opens special characters (accents) correctly
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `locais_exportados_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Empty State Fallback
  if (locations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Análise de Locais</h1>
              <p className="text-gray-500 text-sm mt-1">Visão geral de restaurantes, hotéis e atrações turísticas cadastradas</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl p-12 shadow-sm min-h-[450px] text-center mt-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 opacity-30 animate-ping duration-1000" />
              <div className="relative w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <MapPin size={40} className="animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum Local Cadastrado</h3>
            <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
              Você ainda não cadastrou nenhum ponto turístico, restaurante ou hotel no mapa. Vá para o mapa interativo e comece a adicionar novos locais agora mesmo para ver as estatísticas!
            </p>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-[#0A31A6] hover:bg-blue-800 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 duration-300 cursor-pointer"
            >
              <Plus size={18} />
              <span>Cadastrar Primeiro Local</span>
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Dynamic Statistics Calculations
  const totalPoints = locations.length;
  
  const ratingSum = locations.reduce((acc, curr) => acc + curr.rating, 0);
  const averageRating = totalPoints > 0 ? (ratingSum / totalPoints).toFixed(1) : '0.0';

  const totalFiveStars = locations.filter(l => l.rating === 5).length;

  // Category counts for Recharts Bar Chart
  const categoryCounts = {
    restaurantes: locations.filter(l => l.category === 'restaurantes').length,
    hoteis: locations.filter(l => l.category === 'hoteis').length,
    museus: locations.filter(l => l.category === 'museus').length,
    transporte: locations.filter(l => l.category === 'transporte').length,
    coisas_fazer: locations.filter(l => l.category === 'coisas_fazer').length,
    outros: locations.filter(l => l.category === 'outros').length,
  };

  const categoryChartData = [
    { name: 'Restaurantes', quantidade: categoryCounts.restaurantes, fill: '#F43F5E' },
    { name: 'Hotéis', quantidade: categoryCounts.hoteis, fill: '#0A31A6' },
    { name: 'Museus', quantidade: categoryCounts.museus, fill: '#10B981' },
    { name: 'Lazer', quantidade: categoryCounts.coisas_fazer, fill: '#8B5CF6' },
    { name: 'Transporte', quantidade: categoryCounts.transporte, fill: '#F59E0B' },
    { name: 'Outros', quantidade: categoryCounts.outros, fill: '#6B7280' },
  ];

  // City distribution for Recharts Pie Chart (Grouped by closest city)
  const cityPieData = CITIES.map((city, idx) => {
    const count = locations.filter(l => getNearestCity(l.lat, l.lng) === city.name).length;
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
            <p className="text-gray-500 text-sm mt-1">Visão geral em tempo real de restaurantes, hotéis e atrações turísticas cadastradas</p>
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer text-sm shadow-emerald-600/10"
          >
            <Download size={16} />
            <span>Exportar Excel</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Locais Cadastrados</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalPoints}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <Star size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avaliação Média</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-gray-800">{averageRating}</h3>
                <span className="text-sm text-amber-500 mb-1">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Locais 5 Estrelas</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalFiveStars}</h3>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800">Distribuição por Categoria</h3>
              <p className="text-sm text-gray-500">Quantidade de estabelecimentos cadastrados por tipo de atividade</p>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6B7280' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
