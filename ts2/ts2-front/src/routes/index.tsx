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
