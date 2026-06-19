import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import MapPage from '../pages/MapPage'

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/mapa', element: <MapPage /> },
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
