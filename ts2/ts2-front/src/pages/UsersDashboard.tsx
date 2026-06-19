import { DashboardLayout } from '../components/layout/DashboardLayout';

export function UsersDashboard() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center w-full h-full">
        <h1 className="text-3xl font-bold text-gray-400">Análise de Usuários</h1>
      </div>
    </DashboardLayout>
  );
}
