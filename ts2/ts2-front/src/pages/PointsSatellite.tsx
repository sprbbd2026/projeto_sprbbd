import { useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Radio, ShieldAlert } from 'lucide-react';
import { useMapStore } from '../store/mapStore';

export function PointsSatellites() {
  const { satellites, fetchSatellites, isLoading } = useMapStore();

  useEffect(() => {
    fetchSatellites();
  }, [fetchSatellites]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Carregando satélites...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!satellites || satellites.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Satélites</h1>
            <p className="text-gray-500 text-sm mt-1">Informações dos satélites cadastrados</p>
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
              Não encontramos satélites na base de dados atual.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const operacionais = satellites.filter(s => s.sat_status === 'operacional').length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Satélites</h1>
            <p className="text-gray-500 text-sm mt-1">Informações de satélites cadastrados no sistema</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Radio size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Satélites</p>
              <h3 className="text-2xl font-bold text-gray-800">{satellites.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Satélites Operacionais</p>
              <h3 className="text-2xl font-bold text-gray-800">{operacionais}</h3>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">Listagem de Satélites</h3>
            <p className="text-sm text-gray-500">Detalhamento dos satélites cadastrados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="p-4 font-semibold text-gray-600 text-sm">ID Satélite</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Código PRN</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Número SVN</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Offset Relógio (ns)</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Constelação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {satellites.map((sat) => (
                  <tr key={sat.sat_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-800 text-sm">SAT-{sat.sat_id}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${sat.sat_status === 'operacional'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {sat.sat_status === 'operacional' ? '✓ Operacional' : '✗ Inoperacional'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">{sat.sat_codigo_prn ?? '—'}</td>
                    <td className="p-4 text-gray-600 text-sm">{sat.sat_numero_svn ?? '—'}</td>
                    <td className="p-4 font-mono text-xs text-gray-500">{sat.sat_relogio_offset !== null && sat.sat_relogio_offset !== undefined ? sat.sat_relogio_offset.toFixed(2) : '—'}</td>
                    <td className="p-4 text-gray-600 text-sm">{sat.con_nome ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}