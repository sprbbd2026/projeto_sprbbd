import { DashboardLayout } from '../components/layout/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MapPin, Star, Award } from 'lucide-react';

const cityData = [
  { city: 'São José dos Campos', restaurantes: 45, hoteis: 12, museus: 4 },
  { city: 'Taubaté', restaurantes: 30, hoteis: 8, museus: 3 },
  { city: 'Jacareí', restaurantes: 20, hoteis: 5, museus: 1 },
  { city: 'Ubatuba', restaurantes: 60, hoteis: 45, museus: 2 },
  { city: 'Caraguatatuba', restaurantes: 40, hoteis: 25, museus: 1 },
  { city: 'São Sebastião', restaurantes: 50, hoteis: 35, museus: 2 },
];

const ratingData = [
  { name: '5 Estrelas', value: 215, color: '#F59E0B' }, // amber-500
  { name: '4 Estrelas', value: 130, color: '#10B981' }, // emerald-500
  { name: '3 Estrelas', value: 45, color: '#3B82F6' },  // blue-500
  { name: '2 Estrelas', value: 15, color: '#F97316' },  // orange-500
  { name: '1 Estrela', value: 8, color: '#EF4444' },    // red-500
];

export function PointsDashboard() {
  const totalPoints = cityData.reduce((acc, curr) => acc + curr.restaurantes + curr.hoteis + curr.museus, 0);
  const totalFiveStars = ratingData.find(r => r.name === '5 Estrelas')?.value || 0;
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Análise de Locais</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral de restaurantes, hotéis e atrações turísticas do Vale do Paraíba e Litoral Norte</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Locais Cadastrados</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalPoints}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <Star size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avaliação Média</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-gray-800">4.6</h3>
                <span className="text-sm text-amber-500 mb-1">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
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
              <h3 className="text-lg font-bold text-gray-800">Distribuição por Cidades</h3>
              <p className="text-sm text-gray-500">Quantidade de estabelecimentos cadastrados por categoria</p>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis 
                    dataKey="city" 
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
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', color: '#4B5563' }} />
                  <Bar dataKey="restaurantes" name="Restaurantes" stackId="a" fill="#F43F5E" radius={[0, 0, 4, 4]} /> {/* rose-500 */}
                  <Bar dataKey="hoteis" name="Hotéis" stackId="a" fill="#0A31A6" /> {/* brand blue */}
                  <Bar dataKey="museus" name="Museus" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} /> {/* emerald-500 */}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800">Reputação Geral</h3>
              <p className="text-sm text-gray-500">Distribuição das avaliações dos usuários (1 a 5 estrelas)</p>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {ratingData.map((entry, index) => (
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
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
