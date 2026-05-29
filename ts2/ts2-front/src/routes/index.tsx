import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import { DashboardPage } from '../pages/Dashboard.Page'
import { PointsSatellites } from '../pages/PointsSatellite'

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/map', element: <DashboardPage /> },
  { path: '/satellites', element: <PointsSatellites /> },
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
