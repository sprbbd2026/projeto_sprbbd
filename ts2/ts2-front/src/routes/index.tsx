import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import Login from '../pages/Login'
import { MapPage } from '../pages/Map.Page'
import { DashboardPage } from '../pages/Dashboard.Page'
import { PointsDashboard } from '../pages/PointsDashboard'
import { PointsSatellites } from '../pages/PointsSatellite'
import { UsersDashboard } from '../pages/UsersDashboard'
import { SettingsPage } from '../pages/SettingsPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import Dashboard from '../pages/Dashboard'
import HistoricoMapPage from '../pages/MapPage'
import { SimuladorPage } from '../pages/SimuladorPage'
import { Sidebar } from '../components/map/Sidebar'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MapPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/telemetry',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/mapa',
    element: (
      <ProtectedRoute>
        <HistoricoMapPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/satellites',
    element: (
      <ProtectedRoute>
        <PointsSatellites />
      </ProtectedRoute>
    ),
  },
  { path: '/login', element: <Login /> },
  { path: '/error', element: <UnauthorizedPage /> },
  {
    path: '/dashboards/pontos',
    element: (
      <ProtectedRoute>
        <PointsDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboards/usuarios',
    element: (
      <ProtectedRoute>
        <UsersDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/simulador',
    element: (
      <ProtectedRoute>
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
          <Sidebar isFixed={true} />
          <main className="flex-1 overflow-hidden relative">
            <SimuladorPage />
          </main>
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
