import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, RefreshCw, Smartphone, Users, UserCheck } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { UsersTable } from '../components/ui/UsersTable'
import { useUsers } from '../hooks/useUsers'
import { getDashboardSummary } from '../services/dashboardService'
import { computeAgeDistribution, exportUsersCsv } from '../utils/userAnalytics'

export function UsersDashboard() {
  const { users, loading, error, fetchUsers, clearError } = useUsers()
  const [ts1Users, setTs1Users] = useState<number | null>(null)
  const [ts1Loading, setTs1Loading] = useState(false)
  const [ts1Error, setTs1Error] = useState<string | null>(null)

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const loadTs1Summary = useCallback(async () => {
    setTs1Loading(true)
    try {
      const summary = await getDashboardSummary()
      setTs1Users(summary.users)
      setTs1Error(null)
    } catch {
      setTs1Error('Não foi possível consultar o TS1 (/dashboard/summary).')
    } finally {
      setTs1Loading(false)
    }
  }, [])

  useEffect(() => {
    void loadTs1Summary()
  }, [loadTs1Summary])

  const totalUsers = users.length
  const activeUsers = users.filter((u) => Boolean(u.device_uid)).length
  const withDocument = users.filter((u) => u.documento?.trim()).length

  const ageChartData = useMemo(() => computeAgeDistribution(users), [users])

  const deviceChartData = useMemo(() => {
    const withDevice = users.filter((u) => u.device_uid).length
    const withoutDevice = totalUsers - withDevice
    return [
      { name: 'Com dispositivo', value: withDevice, color: '#0A31A6' },
      { name: 'Sem dispositivo', value: withoutDevice, color: '#94A3B8' },
    ].filter((item) => item.value > 0)
  }, [users, totalUsers])

  async function handleRefreshAll() {
    await Promise.all([fetchUsers(), loadTs1Summary()])
  }

  if (loading && users.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Carregando usuários…</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análise de Usuários</h1>
            <p className="text-gray-500 text-sm mt-1">
              Consulta e visualização dos usuários cadastrados no TS2 (GET /users)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRefreshAll()}
              disabled={loading || ts1Loading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading || ts1Loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => exportUsersCsv(users)}
              disabled={users.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de usuários</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalUsers}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Com dispositivo vinculado</p>
              <h3 className="text-2xl font-bold text-gray-800">{activeUsers}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
              <Smartphone size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Com documento informado</p>
              <h3 className="text-2xl font-bold text-gray-800">{withDocument}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Usuários no TS1 (US304)</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {ts1Loading && ts1Users === null ? '…' : (ts1Users ?? '—')}
              </h3>
              {ts1Error ? <p className="text-xs text-red-500 mt-1">{ts1Error}</p> : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[320px]">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800">Distribuição por faixa etária</h3>
              <p className="text-sm text-gray-500">Calculada a partir de data_nascimento</p>
            </div>
            {ageChartData.length > 0 ? (
              <div className="flex-1 min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                    <Bar dataKey="quantidade" name="Usuários" fill="#0A31A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="flex-1 flex items-center justify-center text-sm text-gray-400">
                Sem datas de nascimento válidas para gerar o gráfico.
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[320px]">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800">Vinculação de dispositivo</h3>
              <p className="text-sm text-gray-500">
                Cadastros por mês indisponíveis — a API não retorna data de cadastro
              </p>
            </div>
            {deviceChartData.length > 0 ? (
              <div className="flex-1 min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" stroke="none">
                      {deviceChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="flex-1 flex items-center justify-center text-sm text-gray-400">Nenhum usuário cadastrado.</p>
            )}
          </div>
        </div>

        <UsersTable
          users={users}
          loading={loading}
          error={error}
          onRefresh={fetchUsers}
          onClearError={clearError}
        />
      </div>
    </DashboardLayout>
  )
}
